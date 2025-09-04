import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { convertBankFiles, previewBankFiles } from '../services/bank/index.js'

const router = Router()
const uploadDir = path.join(process.cwd(), 'uploads', 'bank')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, f, cb) => cb(null, `${Date.now()}-${f.originalname}`)
})
const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_MB||50)*1024*1024, files: Number(process.env.MAX_FILES||10) },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const ok = ['.csv','.xls','.xlsx','.ofx','.qfx','.mt940','.txt','.pdf','.json'].includes(ext)
    console.log('File filter check:', { filename: file.originalname, ext, ok })
    cb(ok ? null : new Error(`Unsupported file: ${ext}`), ok)
  }
})

router.post('/preview', upload.array('files[]'), async (req, res) => {
  try {
    const result = await previewBankFiles(req.files, opts(req))
    res.json(result)
  } catch (e) { res.status(400).json({ error: String(e.message || e) }) }
})

router.post('/convert', upload.array('files[]'), async (req, res) => {
  try {
    const mergeMode = String(req.query.merge || req.body.merge || 'single')
    const { buffer, filename, contentType, metaJson } = await convertBankFiles(req.files, mergeMode, opts(req))
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('X-Conversion-Meta', Buffer.from(JSON.stringify(metaJson)).toString('base64'))
    res.end(buffer)
  } catch (e) { res.status(400).json({ error: String(e.message || e) }) }
})

const opts = (req) => ({
  currency: req.body?.currency,
  dateFormatHint: req.body?.date_format_hint,
  bankHint: req.body?.bank_hint,
  enableOCR: (process.env.ENABLE_OCR || 'false') === 'true',
  include_running_balance: req.body?.include_running_balance === 'true',
  include_accrued_bank_charges: req.body?.include_accrued_bank_charges === 'true',
  categorize: req.body?.categorize === 'true',
  keep_card_ref: req.body?.keep_card_ref === 'true',
  reveal_card_ref: req.body?.reveal_card_ref === 'true',
  emit_vat: req.body?.emit_vat === 'true',
  parse_value_date: req.body?.parse_value_date === 'true',
  fail_on_balance_mismatch: req.body?.fail_on_balance_mismatch === 'true',
  ocr: req.body?.ocr === 'true'
})

export default router
