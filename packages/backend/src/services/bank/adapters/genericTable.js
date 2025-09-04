import dayjs from 'dayjs'

const DATE_PATTERNS = [
  { re: /\b(\d{4})[-/](\d{2})[-/](\d{2})\b/, toIso: (y,m,d)=>`${y}-${m}-${d}` },
  { re: /\b(\d{2})[-/](\d{2})[-/](\d{4})\b/, toIso: (d,m,y)=>`${y}-${m}-${d}` },
  { re: /(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i, toIso: (d,mon,y)=>dayjs(`${d} ${mon} ${y}`,'D MMM YYYY',true).format('YYYY-MM-DD') }
]
const NUM_TAIL = /(?!^)\s*([()-]?\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{2}))?\s*(CR|Cr|DR|Dr)?\s*$/i

const norm = (whole, cents) => {
  const negParen = /^\(.*\)$/.test(whole || '')
  const base = String(whole || '').replace(/[(),\s]/g, '')
  const n = Number(base + (cents ? '.' + cents : ''))
  if (!Number.isFinite(n)) return null
  return negParen ? -Math.abs(n) : n
}

function findDateAnywhere(line, yearHint) {
  for (const p of DATE_PATTERNS) {
    const m = line.match(p.re)
    if (m) {
      const iso = p.toIso(m[1], m[2], m[3] || yearHint)
      return { iso, after: line.slice(m.index + m[0].length).trim() }
    }
  }
  return null
}

function peelRight(line) {
  let rest = line.trimEnd()
  const right = []
  for (let i=0;i<4;i++) {
    const m = rest.match(NUM_TAIL)
    if (!m) break
    right.push({ value: norm(m[1], m[2]), tag: (m[3] || '').toLowerCase() })
    rest = rest.slice(0, m.index).trimEnd()
  }
  return { desc: rest.trim(), right } // right[0]=balance, right[1]=amount, right[2]=fee?
}

export default {
  name: 'generic-table',
  async tryParse(pages, { pdfData }) {
    const yearHint = (pdfData.text.match(/\b(20\d{2})\b/) || [])[1] || new Date().getFullYear()
    const rows = []; const warnings = []
    let curr = null

    const push = () => { if (curr) { rows.push(curr); curr = null } }

    for (const { pageNumber, text } of pages) {
      const lines = text
        .split(/\r?\n/)
        .map(s => s.replace(/\s{2,}/g,' ').replace(/\u00A0/g,' ').trim())
        .filter(Boolean)

      for (let i=0;i<lines.length;i++){
        const line = lines[i]
        const d = findDateAnywhere(line, yearHint)
        if (d) {
          push()
          const { desc, right } = peelRight(d.after)

          const balanceTok = right[0]
          const amountTok  = right[1]
          const feeTok     = right[2]

          let amount = null
          if (amountTok) {
            amount = amountTok.value
            if (amountTok.tag === 'cr') amount = Math.abs(amount)
            else if (amountTok.tag === 'dr') amount = -Math.abs(amount)
          } else if (feeTok) {
            amount = -Math.abs(feeTok.value)
          } else if (right.length === 1) {
            // Single number case: "14 Jul6.003,848.13Cr" - treat as fee
            amount = -Math.abs(right[0].value)
          }

          curr = {
            date: d.iso, value_date: '',
            description: desc || (right.length === 1 ? 'Bank Charge' : ''),
            amount,
            balance: balanceTok ? balanceTok.value : null,
            currency: '',
            type: 'other', method: 'unknown',
            merchant: '', reference: '', card_ref: '',
            fee_amount: feeTok ? Math.abs(feeTok.value) : (right.length === 1 ? Math.abs(right[0].value) : ''),
            vat_amount: '',
            bank_name: '', account_number: '',
            statement_id: '', transaction_id: '',
            page_no: pageNumber, line_no: i+1, source_file: ''
          }
          continue
        }
        if (curr) curr.description = `${curr.description} ${line}`.trim()
      }
      push()
    }

    return { rows, warnings }
  }
}
