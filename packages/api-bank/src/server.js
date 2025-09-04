import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import pino from 'pino'
import bankRoutes from './routes/bank.js'

const app = express()
const log = pino({ name: 'api-bank' })
const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5175,http://127.0.0.1:5175').split(',').map(s=>s.trim()).filter(Boolean)

app.use(helmet())
app.use(cors({ origin: origins, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/v1/healthz', (_,res)=>res.json({ ok: true, service:'api-bank' }))

// Add request logging middleware
app.use((req, res, next) => {
  log.info({ method: req.method, url: req.url, origin: req.get('origin') }, 'Incoming request')
  next()
})

app.use('/v1/bank', bankRoutes)

const port = Number(process.env.PORT || 4000)
app.listen(port, '0.0.0.0', () => log.info({ port, host: '0.0.0.0' }, 'api-bank listening'))
