// Simple PDF parser that tries to extract any transaction-like data
import dayjs from 'dayjs'

const DATE_PATTERNS = [
  /^(\d{4})[-/](\d{2})[-/](\d{2})\b/,  // 2025-08-12 or 2025/08/12
  /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/,  // 12/08/2025
  /^(\d{1,2})\s+(\d{1,2})\s+(\d{4})\b/,  // 12 08 2025
  /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i  // 12 Aug
]

const AMOUNT_PATTERNS = [
  /([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(Cr|Cr|DR|Dr)?\s*$/i,
  /R\s*([+-]?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(Cr|Cr|DR|Dr)?\s*$/i,
  /([+-]?\d+\.\d{2})\s*(Cr|Cr|DR|Dr)?\s*$/i
]

function findDate(line) {
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern)
    if (match) {
      if (pattern === DATE_PATTERNS[0]) {
        return { iso: `${match[1]}-${match[2]}-${match[3]}`, rest: line.replace(pattern, '').trim() }
      } else if (pattern === DATE_PATTERNS[1]) {
        return { iso: `${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`, rest: line.replace(pattern, '').trim() }
      } else if (pattern === DATE_PATTERNS[2]) {
        return { iso: `${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`, rest: line.replace(pattern, '').trim() }
      } else if (pattern === DATE_PATTERNS[3]) {
        const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' }
        const month = monthMap[match[2].toLowerCase()]
        if (month) {
          const year = new Date().getFullYear()
          return { iso: `${year}-${month}-${match[1].padStart(2,'0')}`, rest: line.replace(pattern, '').trim() }
        }
      }
    }
  }
  return null
}

function findAmount(line) {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = line.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''))
      const isCredit = match[2] && match[2].toLowerCase().includes('cr')
      return { amount: isCredit ? Math.abs(amount) : -Math.abs(amount), rest: line.replace(pattern, '').trim() }
    }
  }
  return null
}

export default {
  name: 'simple-pdf',
  async tryParse(pages, { pdfData }) {
    console.log('Simple PDF Parser: Starting...')
    const rows = []
    const warnings = []
    
    for (const { pageNumber, text } of pages) {
      const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
      console.log(`Simple Parser: Page ${pageNumber} has ${lines.length} lines`)
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Look for date patterns
        const dateMatch = findDate(line)
        if (dateMatch) {
          console.log(`Simple Parser: Found date at line ${i}: ${dateMatch.iso}`)
          
          // Try to find amount in the same line or next few lines
          let amount = null
          let description = dateMatch.rest
          
          // Check current line for amount
          const amountMatch = findAmount(line)
          if (amountMatch) {
            amount = amountMatch.amount
            description = amountMatch.rest
          } else {
            // Check next few lines for amount
            for (let j = 1; j <= 3 && i + j < lines.length; j++) {
              const nextLine = lines[i + j]
              const nextAmountMatch = findAmount(nextLine)
              if (nextAmountMatch) {
                amount = nextAmountMatch.amount
                description = `${description} ${nextLine.replace(nextAmountMatch.rest, '').trim()}`.trim()
                break
              }
            }
          }
          
          if (amount !== null) {
            rows.push({
              date: dateMatch.iso,
              value_date: '',
              description: description || 'Transaction',
              amount: amount,
              balance: null,
              currency: 'ZAR',
              type: 'other',
              method: 'unknown',
              merchant: '',
              reference: '',
              card_ref: '',
              fee_amount: '',
              vat_amount: '',
              bank_name: 'FNB',
              account_number: '',
              statement_id: '',
              transaction_id: '',
              page_no: pageNumber,
              line_no: i + 1,
              source_file: ''
            })
            console.log(`Simple Parser: Added transaction: ${dateMatch.iso} | ${description} | R${amount}`)
          }
        }
      }
    }
    
    console.log(`Simple Parser: Found ${rows.length} transactions`)
    return { rows, warnings }
  }
}
