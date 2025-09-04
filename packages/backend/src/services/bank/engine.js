// Multi-bank parsing engine: tries known adapters first, then generic fallback
import fs from 'fs/promises'
import pdf from 'pdf-parse'
import crypto from 'crypto'
import dayjs from 'dayjs'
import fnbAdapter from './adapters/fnbPdf.js'
import genericAdapter from './adapters/genericTable.js'

const ADAPTERS = [fnbAdapter, genericAdapter]

// Helpers
const fmtNum = n => (n === null || n === undefined || Number.isNaN(n)) ? '' : Number(n).toString()

export async function preview(files, opts = {}) {
  const f = files?.[0]
  if (!f) throw new Error('No file uploaded')

  // Load bytes
  const bytes = await fs.readFile(f.path)

  // NOTE: we only handle PDF here; CSV/XLSX can use existing parsers if you already have them.
  // Extend later if needed.
  const pdfData = await pdf(bytes)
  const rawPages = pdfData.text.split(/\f/g).map((t, i) => ({ pageNumber: i + 1, text: t }))

  // Try adapters
  let result = { rows: [], warnings: [] }
  for (const a of ADAPTERS) {
    const out = await a.tryParse(rawPages, { pdfData, opts })
    if (out.warnings?.length) result.warnings.push(...out.warnings)
    if (out.rows?.length) { result = out; break }   // accept as soon as we have rows
  }

  // Normalize + IDs + formatting
  const dateFormat = opts.date_format || 'YYYY-MM-DD'
  const rows = result.rows.map((r, idx) => {
    const id = crypto.createHash('sha1').update(
      [r.date, r.description, r.amount, r.balance, r.page_no, r.line_no].join('|')
    ).digest('hex').slice(0, 16)

    // safe formatting
    const date = r.date ? dayjs(r.date).isValid() ? dayjs(r.date).format(dateFormat) : r.date : ''
    const value_date = r.value_date ? (dayjs(r.value_date).isValid() ? dayjs(r.value_date).format(dateFormat) : r.value_date) : ''

    return {
      ...r,
      date, value_date,
      amount: fmtNum(r.amount),
      balance: fmtNum(r.balance),
      transaction_id: id,
      idx
    }
  })

  return {
    rows,
    warnings: result.warnings ?? [],
    meta: result.meta ?? {}
  }
}

export async function convert(files, opts = {}) {
  const { rows, meta } = await preview(files, opts)

  // Column order (reorderable from UI)
  const cols = opts.columns?.length ? opts.columns : [
    'date','value_date','description','amount','balance','currency',
    'type','method','merchant','reference','card_ref',
    'fee_amount','vat_amount','bank_name','account_number',
    'statement_id','transaction_id','page_no','line_no','source_file'
  ]

  const esc = s => (s==null?'':String(s).replace(/"/g,'""'))
  const header = cols.join(',')
  const lines = rows.map(r => cols.map(c => {
    const v = r[c]
    return (typeof v === 'string' && (v.includes(',') || v.includes('"'))) ? `"${esc(v)}"` : (v ?? '')
  }).join(','))

  const csv = [header, ...lines].join('\n')
  return {
    buffer: Buffer.from(csv),
    filename: 'bank-converted.csv',
    contentType: 'text/csv',
    metaJson: { ...meta, row_count: rows.length, columns: cols }
  }
}
