import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { documents } from './routes/documents.js';
import { sign } from './routes/sign.js';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '15mb' }));
app.use(cors({
  origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
  credentials: false
}));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.use(documents);
app.use(sign);

app.get('/health', (_, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`sign-api listening on ${port}`));

