import dayjs from 'dayjs'

const MON = '(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'
// find "DD Mon" ANYWHERE - handle both spaced and non-spaced formats (14Jul, 14 Jul)
const DATE_ANY_RE = new RegExp(`(\\d{1,2})\\s*${MON}`, 'i')

// number token at line END, optional decimals and "Cr"
const NUM_TAIL = /(?!^)\s*([()-]?\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{2}))?\s*(Cr)?\s*$/i

const norm = (whole, cents) => {
  const negParen = /^\(.*\)$/.test(whole || '')
  const base = String(whole || '').replace(/[(),\s]/g, '')
  const n = Number(base + (cents ? '.' + cents : ''))
  if (!Number.isFinite(n)) return null
  return negParen ? -Math.abs(n) : n
}

const toISO = (d, m, y) => {
  const t = dayjs(`${d} ${m} ${y}`, 'D MMM YYYY', true)
  return t.isValid() ? t.format('YYYY-MM-DD') : ''
}

function peelRight(line) {
  let rest = line.trimEnd()
  const right = []
  for (let i = 0; i < 6; i++) { // Increased to capture more numbers
    const m = rest.match(NUM_TAIL)
    if (!m) break
    right.push({ value: norm(m[1], m[2]), cr: !!m[3] }) // rightmost-first
    rest = rest.slice(0, m.index).trimEnd()
  }
  return { desc: rest.trim(), right } // right[0]=balance, right[1]=amount, right[2]=fee?, right[3]=vat?, right[4]=other?
}

function classify(desc) {
  const s = desc.toLowerCase()
  if (s.includes('send money app dr')) return { type:'transfer_out', method:'send_money' }
  if (s.startsWith('fnb app transfer from')) return { type:'transfer_in', method:'fnb_app' }
  if (s.includes('rtc pmt to') || s.includes('payment to') || s.includes('internet pmt')) return { type:'transfer_out', method:'internet' }
  if (s.startsWith('pos purchase')) return { type:'card_pos', method:'pos' }
  if (s.startsWith('fuel purchase')) return { type:'fuel', method:'pos' }
  if (s.includes('prepaid airtime')) return { type:'airtime', method:'fnb_app' }
  if (s.includes('electricity')) return { type:'electricity', method:'fnb_app' }
  if (s.includes('debit order')) return { type:'transfer_out', method:'internet' }
  
  // Enhanced fee and charge detection
  if (s.includes('fee') || s.includes('charge') || s.includes('commission') || s.includes('service charge')) {
    return { type:'bank_charge', method:'fee' }
  }
  if (s.includes('interest')) return { type:'interest', method:'interest' }
  if (s.includes('card')) return { type:'card_transaction', method:'card' }
  if (s.includes('transfer')) return { type:'transfer', method:'transfer' }
  if (s.includes('payment')) return { type:'payment', method:'payment' }
  if (s.includes('deposit')) return { type:'deposit', method:'deposit' }
  if (s.includes('withdrawal') || s.includes('atm')) return { type:'withdrawal', method:'atm' }
  
  return { type:'other', method:'unknown' }
}

export default {
  name: 'fnb-pdf',
  async tryParse(pages, { pdfData }) {
    const yearHint = (pdfData.text.match(/\b(20\d{2})\b/) || [])[1] || new Date().getFullYear()
    const rows = []; const warnings = []
    let seenAnyDate = false
    let curr = null

    const push = () => { if (curr) { rows.push(curr); curr = null } }

    for (const { pageNumber, text } of pages) {
      const lines = text
        .split(/\r?\n/)
        .map(s => s.replace(/\s{2,}/g, ' ').replace(/\u00A0/g, ' ').trim()) // collapse & NBSP
        .filter(Boolean)

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // find "DD Mon" anywhere; use substring after match as row body
        const dm = line.match(DATE_ANY_RE)
        if (dm) {
          seenAnyDate = true
          push()

          const iso = toISO(dm[1], dm[2], yearHint)
          const after = line.slice(dm.index + dm[0].length).trim()
          const { desc, right } = peelRight(after)

          const balanceTok = right[0]
          const amountTok  = right[1]
          const feeTok     = right[2]
          const vatTok     = right[3]
          const otherTok   = right[4]

          let amount = null
          let feeAmount = null
          let vatAmount = null
          let bankCharges = null

          if (amountTok) {
            amount = amountTok.cr ? Math.abs(amountTok.value) : -Math.abs(amountTok.value)
          } else if (feeTok) {
            // Fee-only rows: "14 Jul6.003,848.13Cr" - the first number is the fee
            amount = -Math.abs(feeTok.value)
          } else if (right.length === 1) {
            // Single number case: "14 Jul6.003,848.13Cr" - treat as fee
            amount = -Math.abs(right[0].value)
          }

          // Extract fees and charges more comprehensively
          if (feeTok) {
            feeAmount = Math.abs(feeTok.value)
            bankCharges = feeAmount
          } else if (right.length === 1 && desc.toLowerCase().includes('fee')) {
            // Single number with "fee" in description
            feeAmount = Math.abs(right[0].value)
            bankCharges = feeAmount
          }

          // Extract VAT if present
          if (vatTok) {
            vatAmount = Math.abs(vatTok.value)
          }

          // Look for additional fee patterns in description
          const feePatterns = [
            /fee\s*:?\s*R?\s*([\d,]+\.?\d*)/i,
            /charge\s*:?\s*R?\s*([\d,]+\.?\d*)/i,
            /commission\s*:?\s*R?\s*([\d,]+\.?\d*)/i,
            /service\s*charge\s*:?\s*R?\s*([\d,]+\.?\d*)/i,
            /bank\s*charge\s*:?\s*R?\s*([\d,]+\.?\d*)/i
          ]

          for (const pattern of feePatterns) {
            const match = desc.match(pattern)
            if (match) {
              const extractedFee = parseFloat(match[1].replace(/,/g, ''))
              if (extractedFee > 0) {
                feeAmount = extractedFee
                bankCharges = extractedFee
                break
              }
            }
          }

          curr = {
            date: iso, value_date: '',
            description: desc || (right.length === 1 ? 'Bank Charge' : ''),
            amount,
            balance: balanceTok ? balanceTok.value : null,
            currency: 'ZAR',
            ...classify(desc),
            merchant: '', reference: '',
            card_ref: (desc.match(/[0-9]{4}\*?[0-9*]{2,8}/) || [''])[0],
            fee_amount: feeAmount || '',
            vat_amount: vatAmount || '',
            bank_charges: bankCharges || '',
            bank_name: 'FNB',
            account_number: '', statement_id: '', transaction_id: '',
            page_no: pageNumber, line_no: i + 1, source_file: ''
          }
          continue
        }

        // continuation of previous description
        if (curr) curr.description = `${curr.description} ${line}`.trim()
      }
      push()
    }

    if (!seenAnyDate) warnings.push('FNB parser: no date tokens found (DD Mon) anywhere on lines.')
    return { rows, warnings }
  }
}
