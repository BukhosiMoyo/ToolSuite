import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { preview, convert } from '../services/bank/engine.js'

const router = Router()
const uploadDir = path.join(process.cwd(), 'uploads', 'bank')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, f, cb) => cb(null, `${Date.now()}-${f.originalname}`)
})
const upload = multer({ storage, limits: { fileSize: 50*1024*1024, files: 10 } })

router.post('/preview', upload.array('files[]'), async (req, res) => {
  try {
    console.log('Bank preview request:', { files: req.files?.length, body: req.body })
    const out = await preview(req.files, {
      date_format: req.body?.date_format,
      columns: req.body?.columns ? JSON.parse(req.body.columns) : undefined
    })
    console.log('Bank preview result:', { rows: out.rows?.length, warnings: out.warnings?.length })
    res.json(out)
  } catch (e) {
    console.error('Bank preview error:', e)
    res.status(400).json({ error: String(e.message || e) })
  }
})

router.post('/convert', upload.array('files[]'), async (req, res) => {
  try {
    const mergeMode = req.query.merge || 'single'
    console.log('Bank convert request:', { files: req.files?.length, body: req.body, mergeMode })
    
    const out = await convert(req.files, {
      date_format: req.body?.date_format,
      columns: req.body?.columns ? JSON.parse(req.body.columns) : undefined
    })
    
    console.log('Bank convert result:', { rows: out.metaJson?.row_count, columns: out.metaJson?.columns?.length })
    
    res.setHeader('Content-Type', out.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`)
    // Debug headers to verify what's being used
    res.setHeader('X-Engine', 'bank/engine@v1')
    res.setHeader('X-Conversion-Meta', Buffer.from(JSON.stringify(out.metaJson)).toString('base64'))
    res.end(out.buffer)
  } catch (e) {
    console.error('Bank convert error:', e)
    res.status(400).json({ error: String(e.message || e) })
  }
})

export default router