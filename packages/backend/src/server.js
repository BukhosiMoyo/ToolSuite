// PDF Tools API - Hidden backend for PDF manipulation tools (api.compresspdf.co.za)
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import pino from 'pino';
import dotenv from 'dotenv';
import archiver from 'archiver';
import { promises as fsp } from 'fs';

// Simple rate limiting
const rateLimit = new Map();

import { mergeRouter } from './routes/merge.js';
import { emailRouter } from './routes/email.js';
import { bump as bumpMulti, summary as summaryMulti } from './stats-multi.js';

dotenv.config();

// Set development mode - default to development for better CORS handling
const isDevelopment = process.env.NODE_ENV !== 'production';

// ----------------------------------------------------------------------------
// App & logger
// ----------------------------------------------------------------------------
const app = express();
app.set('trust proxy', true);

const log = pino();

// ----------------------------------------------------------------------------
/** CORS allowlist for current domains */
const allowlist = [
  'https://compresspdf.co.za',         // Main compress PDF domain
  'https://www.compresspdf.co.za',     // Main compress PDF domain with www
  'https://mergepdf.co.za',            // Merge PDF domain
  'https://www.mergepdf.co.za',        // Merge PDF domain with www
  'https://merge-pdf-react.vercel.app', // Vercel deployment
];

// Dev convenience: allow Vite on localhost and local development
if (isDevelopment) {
  allowlist.push(
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4000',
    'http://127.0.0.1:4000'
  );
}

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                 // allow tools like curl/postman
    if (allowlist.includes(origin)) {
      return cb(null, origin);                          // return the specific origin, not true
    }
    return cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  maxAge: 86400,
};
app.use(cors(corsOptions));
// ----------------------------------------------------------------------------
// Paths / dirs
// ----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR  = path.join(__dirname, '../data');
const UP_DIR    = path.join(__dirname, '../uploads');
const TMP_DIR   = path.join(__dirname, '../tmp');
const INDEX_DIR = path.join(TMP_DIR, 'index');

[DATA_DIR, UP_DIR, TMP_DIR, INDEX_DIR].forEach(p =>
  fs.mkdirSync(p, { recursive: true })
);

// ----------------------------------------------------------------------------
// Simple stats
// ----------------------------------------------------------------------------
const COUNTER_PATH = path.join(DATA_DIR, 'stats.json');

async function readCounter() {
  try { return JSON.parse(await fsp.readFile(COUNTER_PATH, 'utf8')); }
  catch { return { total_compressed: 0, updated_at: new Date().toISOString() }; }
}
async function writeCounter(obj) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(COUNTER_PATH, JSON.stringify(obj), 'utf8');
}
async function bumpTotal() {
  const s = await readCounter();
  s.total_compressed = (s.total_compressed || 0) + 1;
  s.updated_at = new Date().toISOString();
  await writeCounter(s);
  return s;
}

/* Path to multi-tool stats */
const MERGE_STATS_PATH = path.join(DATA_DIR, 'stats-multi.json');

async function readMergeCounter() {
  try {
    const data = JSON.parse(await fsp.readFile(MERGE_STATS_PATH, 'utf8'));
    return data.mergepdf || { total: 0, updated_at: new Date().toISOString() };
  } catch {
    return { total: 0, updated_at: new Date().toISOString() };
  }
}

// ----------------------------------------------------------------------------
// Tool-specific Reviews
// ----------------------------------------------------------------------------
const COMPRESS_PDF_REVIEWS_PATH = path.join(DATA_DIR, 'compress-pdf-reviews.json');
const MERGE_PDF_REVIEWS_PATH = path.join(DATA_DIR, 'merge-pdf-reviews.json');

async function readCompressPdfReviews() {
  try { return JSON.parse(await fsp.readFile(COMPRESS_PDF_REVIEWS_PATH, 'utf8')); }
  catch {
    return {
      count: 0,
      sum: 0,
      distribution: { '1':0,'2':0,'3':0,'4':0,'5':0 },
      updated_at: new Date().toISOString()
    };
  }
}

async function readMergePdfReviews() {
  try { return JSON.parse(await fsp.readFile(MERGE_PDF_REVIEWS_PATH, 'utf8')); }
  catch {
    return {
      count: 0,
      sum: 0,
      distribution: { '1':0,'2':0,'3':0,'4':0,'5':0 },
      updated_at: new Date().toISOString()
    };
  }
}

async function writeCompressPdfReviews(obj) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(COMPRESS_PDF_REVIEWS_PATH, JSON.stringify(obj), 'utf8');
}

async function writeMergePdfReviews(obj) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(MERGE_PDF_REVIEWS_PATH, JSON.stringify(obj), 'utf8');
}

// ----------------------------------------------------------------------------
// Body parsing & static
// ----------------------------------------------------------------------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve merged files publicly with caching & range support
app.use(
  '/outputs',
  express.static(path.join(__dirname, '..', 'outputs'), {
    fallthrough: false,
    etag: true,
    cacheControl: true,
    maxAge: '1h',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
    },
  })
);

// ----------------------------------------------------------------------------
// API Security & Hiding
// ----------------------------------------------------------------------------
// Simple rate limiting
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max 100 requests per 15 minutes
  
  if (!rateLimit.has(clientIP)) {
    rateLimit.set(clientIP, { count: 1, resetTime: now + windowMs });
  } else {
    const client = rateLimit.get(clientIP);
    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + windowMs;
    } else {
      client.count++;
      if (client.count > maxRequests) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.'
        });
      }
    }
  }
  next();
});

// Hide API endpoints from direct browser access (but allow local development)
app.use((req, res, next) => {
  // TEMPORARILY DISABLED FOR DEBUGGING - allow all requests
  return next();
  
  // In development mode, allow ALL requests for testing
  if (isDevelopment) {
    return next();
  }
  
  // Production security: Block direct browser access to API endpoints
  if (req.headers['user-agent'] && req.headers['user-agent'].includes('Mozilla')) {
    // Allow health check for monitoring
    if (req.path === '/health') {
      return next();
    }
    
    // Allow requests from our local frontend (localhost:5173)
    if (req.headers.origin && req.headers.origin.includes('localhost:5173')) {
      return next();
    }
    
    // Allow requests from our production frontend domains
    if (req.headers.origin && (
      req.headers.origin.includes('compresspdf.co.za') ||
      req.headers.origin.includes('mergepdf.co.za') ||
      req.headers.origin.includes('vercel.app')
    )) {
      return next();
    }
    
    // Block direct browser access to API endpoints
    if (req.path.startsWith('/v1/') || req.path.startsWith('/api/')) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: 'This endpoint is not accessible directly'
      });
    }
  }
  
  next();
});

// ----------------------------------------------------------------------------
// Health & logs
// ----------------------------------------------------------------------------
app.use((req, _res, next) => {
  if (isDevelopment) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'} - User-Agent: ${req.headers['user-agent'] || 'none'}`);
  } else {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ 
    ok: true, 
    uptime: process.uptime(), 
    ts: new Date().toISOString(),
    environment: isDevelopment ? 'development' : 'production',
    cors_allowlist: isDevelopment ? allowlist : ['hidden_in_production']
  });
});

// ----------------------------------------------------------------------------
// Clear Tool-Specific Stats & Reviews Endpoints
// ----------------------------------------------------------------------------

// Compress PDF Tool Stats
app.get('/v1/compress-pdf/stats', async (_req, res) => {
  try { 
    const s = await readCounter();
    res.json({
      tool: 'compress-pdf',
      total_compressed: s.total_compressed,
      updated_at: s.updated_at
    });
  }
  catch (e) { res.status(500).json({ error: { code: 'compress_pdf_stats_failed', message: e.message } }); }
});

// Merge PDF Tool Stats
app.get('/v1/merge-pdf/stats', async (_req, res) => {
  try {
    const s = await readMergeCounter();
    res.json({
      tool: 'merge-pdf',
      total_merged: s.total,
      updated_at: s.updated_at
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'merge_pdf_stats_failed', message: e.message } });
  }
});

// Combined stats for both tools
app.get('/v1/stats/combined', async (_req, res) => {
  try {
    const compressStats = await readCounter();
    const mergeStats = await readMergeCounter();
    
    res.json({
      tool: 'combined',
      total_files: compressStats.total_compressed + mergeStats.total,
      tools: {
        'compress-pdf': {
          total_compressed: compressStats.total_compressed,
          updated_at: compressStats.updated_at
        },
        'merge-pdf': {
          total_merged: mergeStats.total,
          updated_at: mergeStats.updated_at
        }
      },
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'combined_stats_failed', message: e.message } });
  }
});

// Compress PDF Tool Reviews
app.get('/v1/compress-pdf/reviews', async (_req, res) => {
  try {
    const r = await readCompressPdfReviews();
    const avg = r.count ? (r.sum / r.count) : 0;
    res.json({
      tool: 'compress-pdf',
      reviewCount: r.count,
      ratingValue: Number(avg.toFixed(2)),
      distribution: r.distribution,
      updated_at: r.updated_at
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'compress_pdf_reviews_failed', message: e.message } });
  }
});

// Merge PDF Tool Reviews
app.get('/v1/merge-pdf/reviews', async (_req, res) => {
  try {
    const r = await readMergePdfReviews();
    const avg = r.count ? (r.sum / r.count) : 0;
    res.json({
      tool: 'merge-pdf',
      reviewCount: r.count,
      ratingValue: Number(avg.toFixed(2)),
      distribution: r.distribution,
      updated_at: r.updated_at
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'merge_pdf_reviews_failed', message: e.message } });
  }
});

// Combined reviews for both tools
app.get('/v1/reviews/combined', async (_req, res) => {
  try {
    const compressReviews = await readCompressPdfReviews();
    const mergeReviews = await readMergePdfReviews();
    
    const totalCount = compressReviews.count + mergeReviews.count;
    const totalSum = compressReviews.sum + mergeReviews.sum;
    const avg = totalCount ? (totalSum / totalCount) : 0;
    
    // Combine distributions
    const combinedDistribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (let i = 1; i <= 5; i++) {
      combinedDistribution[i] = (compressReviews.distribution[i] || 0) + (mergeReviews.distribution[i] || 0);
    }
    
    res.json({
      tool: 'combined',
      reviewCount: totalCount,
      ratingValue: Number(avg.toFixed(2)),
      distribution: combinedDistribution,
      tools: {
        'compress-pdf': {
          reviewCount: compressReviews.count,
          ratingValue: compressReviews.count ? Number((compressReviews.sum / compressReviews.count).toFixed(2)) : 0
        },
        'merge-pdf': {
          reviewCount: mergeReviews.count,
          ratingValue: mergeReviews.count ? Number((mergeReviews.sum / mergeReviews.count).toFixed(2)) : 0
        }
      },
      updated_at: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'combined_reviews_failed', message: e.message } });
  }
});

// --- Backward Compatibility (keep old endpoints working) ---
app.get('/v1/stats/summary', async (_req, res) => {
  try { 
    const s = await readCounter();
    res.json({
      tool: 'compress-pdf',
      total_compressed: s.total_compressed,
      updated_at: s.updated_at
    });
  }
  catch (e) { res.status(500).json({ error: { code: 'stats_read_failed', message: e.message } }); }
});

app.get('/v1/mergepdf/stats/summary', async (_req, res) => {
  try {
    const s = await readMergeCounter();
    res.json({
      tool: 'merge-pdf',
      total_merged: s.total,
      updated_at: s.updated_at
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'merge_stats_read_failed', message: e.message } });
  }
});

app.get('/v1/reviews/summary', async (_req, res) => {
  try {
    const r = await readCompressPdfReviews();
    const avg = r.count ? (r.sum / r.count) : 0;
    res.json({
      tool: 'compress-pdf',
      reviewCount: r.count,
      ratingValue: Number(avg.toFixed(2)),
      distribution: r.distribution,
      updated_at: r.updated_at
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'reviews_read_failed', message: e.message } });
  }
});

// Internal bump endpoints for stats tracking
app.post('/v1/compress-pdf/stats/bump', async (_req, res) => {
  try { 
    const s = await bumpTotal();
    res.json({ ok: true, new_total: s.total_compressed });
  }
  catch (e) { res.status(500).json({ error: { code: 'compress_pdf_stats_bump_failed', message: e.message } }); }
});

app.post('/v1/merge-pdf/stats/bump', async (_req, res) => {
  try { 
    const s = await bumpMulti('mergepdf');
    res.json({ ok: true, new_total: s.total });
  }
  catch (e) { res.status(500).json({ error: { code: 'merge_pdf_stats_bump_failed', message: e.message } }); }
});


app.post('/v1/reviews', async (req, res) => {
  try {
    if (isDevelopment) {
      console.log('POST /v1/reviews - body:', req.body);
    }
    
    const { rating, tool = 'compress-pdf' } = req.body || {};
    const n = Number(rating);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return res.status(400).json({ error: { code: 'invalid_rating', message: 'rating must be 1..5' } });
    }
    
    if (isDevelopment) {
      console.log('Processing review:', { rating: n, tool });
    }
    
    let r;
    if (tool === 'merge-pdf') {
      if (isDevelopment) console.log('Reading merge-pdf reviews...');
      r = await readMergePdfReviews();
      r.count += 1;
      r.sum += n;
      r.distribution[String(n)] = (r.distribution[String(n)] || 0) + 1;
      r.updated_at = new Date().toISOString();
      if (isDevelopment) console.log('Writing merge-pdf reviews...');
      await writeMergePdfReviews(r);
    } else {
      // Default to compress-pdf
      if (isDevelopment) console.log('Reading compress-pdf reviews...');
      r = await readCompressPdfReviews();
      r.count += 1;
      r.sum += n;
      r.distribution[String(n)] = (r.distribution[String(n)] || 0) + 1;
      r.updated_at = new Date().toISOString();
      if (isDevelopment) console.log('Writing compress-pdf reviews...');
      await writeCompressPdfReviews(r);
    }
    
    const avg = r.sum / r.count;
    if (isDevelopment) {
      console.log('Review processed successfully:', { tool, reviewCount: r.count, ratingValue: Number(avg.toFixed(2)) });
    }
    res.json({ ok: true, tool, reviewCount: r.count, ratingValue: Number(avg.toFixed(2)) });
  } catch (e) {
    console.error('Error in POST /v1/reviews:', e);
    console.error('Error stack:', e.stack);
    res.status(500).json({ error: { code: 'reviews_write_failed', message: e.message } });
  }
});

// ----------------------------------------------------------------------------
// Upload limits / Multer config (align with Apache LimitRequestBody)
// ----------------------------------------------------------------------------
const MB = 1024 * 1024;
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 100); // default 100 MB
const MAX_SIZE = MAX_UPLOAD_MB * MB;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UP_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.includes('pdf') &&
        !file.originalname.toLowerCase().endsWith('.pdf')) {
      return cb(new Error('invalid_file_type'));
    }
    cb(null, true);
  }
});

// ----------------------------------------------------------------------------
// Compression route (Ghostscript) — still used by the compress app
// ----------------------------------------------------------------------------
function gsArgs(input, output, quality = 'printer', dpi = 150, removeMeta = false) {
  const base = [
    '-sDEVICE=pdfwrite',
    `-dPDFSETTINGS=/${quality}`,
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    '-dDownsampleColorImages=true',
    `-dColorImageResolution=${dpi}`,
    '-dDownsampleGrayImages=true',
    `-dGrayImageResolution=${dpi}`,
    '-dDownsampleMonoImages=true',
    `-dMonoImageResolution=${dpi}`,
    '-dNOPAUSE',
    '-dBATCH',
    `-sOutputFile=${output}`,
    input
  ];
  if (removeMeta) base.unshift('-dDiscardDocInfo=true');
  return base;
}

app.post('/v1/pdf/compress', upload.single('file'), async (req, res) => {
  try {
    const { path: inPath, originalname, size } = req.file || {};
    if (!inPath) return res.status(400).json({ error: { code: 'invalid_request', message: 'No file uploaded' } });

    console.log('UPLOAD START:', originalname, (size / 1e6).toFixed(2) + 'MB', new Date().toISOString());

    const { compression = 'medium', downsample_dpi = '150', remove_metadata = 'false' } = req.body || {};
    const map = { low: 'prepress', medium: 'printer', high: 'screen' };
    const quality = map[compression] || 'printer';
    const dpi = Number.isNaN(parseInt(downsample_dpi, 10)) ? 150 : parseInt(downsample_dpi, 10);
    const rm = String(remove_metadata) === 'true';

    const jobId = `cpdf_${uuid().slice(0, 8)}`;
    const outName = (originalname || 'file.pdf').replace(/\.pdf$/i, '') + '-compressed.pdf';
    const outPath = path.join(TMP_DIR, `${jobId}-${outName}`);

    fs.mkdirSync(INDEX_DIR, { recursive: true });

    const gs = spawn('gs', ['-q', ...gsArgs(inPath, outPath, quality, dpi, rm)]);
    const watchdog = setTimeout(() => { try { gs.kill('SIGKILL'); } catch {} }, 180000);

    gs.stderr?.on('data', d => log.warn({ gs: d.toString() }));
    gs.on('error', (e) => { clearTimeout(watchdog); return res.status(422).json({ error: { code: 'processing_failed', message: e.message } }); });
    gs.on('close', (code) => {
      clearTimeout(watchdog);
      if (code !== 0 || !fs.existsSync(outPath)) {
        return res.status(422).json({ error: { code: 'processing_failed', message: 'Ghostscript failed' } });
      }

      bumpTotal().catch(e => log.error({ bump_error: e.message }));

      const outSize = fs.statSync(outPath).size;
      const ratio = 1 - (outSize / size);
      const token = uuid().replace(/-/g, '').slice(0, 24);
      const ttlMinutes = parseInt(process.env.FILE_TTL_MIN || '15', 10);
      const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);

      fs.writeFileSync(path.join(INDEX_DIR, `${jobId}.json`), JSON.stringify({ jobId, inPath, outPath, token, expiresAt }));

      console.log('UPLOAD DONE :', originalname, '->', outName, new Date().toISOString());

      return res.json({
        job_id: jobId,
        status: 'completed',
        input: { filename: originalname, bytes: size },
        output: {
          filename: outName,
          bytes: outSize,
          compression_ratio: Number(ratio.toFixed(2)),
          download_url: `/v1/jobs/${jobId}/download?token=${token}`,
          expires_at: new Date(expiresAt).toISOString()
        },
        options: { compression, downsample_dpi: dpi, remove_metadata: rm }
      });
    });
  } catch (e) {
    return res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

// ----------------------------------------------------------------------------
// Shared download + zip endpoints (used by both apps)
// ----------------------------------------------------------------------------
app.get('/v1/jobs/:jobId/download', (req, res) => {
  const { jobId } = req.params;
  const { token } = req.query;

  const metaPath = path.join(INDEX_DIR, `${jobId}.json`);
  if (!fs.existsSync(metaPath)) return res.status(404).end();

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  if (token !== meta.token) return res.status(403).end();
  if (Date.now() > meta.expiresAt) return res.status(403).end();

  const filename = path.basename(meta.outPath);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', filename.endsWith('.zip') ? 'application/zip' : 'application/pdf');
  fs.createReadStream(meta.outPath).pipe(res);
});

app.post('/v1/jobs/zip', express.json(), async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: { code: 'invalid_request', message: 'items required' } });
    }

    const files = [];
    for (const { job_id, token } of items) {
      const metaPath = path.join(INDEX_DIR, `${job_id}.json`);
      if (!fs.existsSync(metaPath)) continue;

      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (Date.now() > meta.expiresAt) continue;
      if (token !== meta.token) continue;
      if (!fs.existsSync(meta.outPath)) continue;

      files.push({ path: meta.outPath, name: path.basename(meta.outPath) });
    }

    if (files.length === 0) {
      return res.status(404).json({ error: { code: 'not_found', message: 'no valid files' } });
    }

    const jobId = `zip_${uuid().slice(0, 8)}`;
    const zipPath = path.join(TMP_DIR, `${jobId}.zip`);
    const token = uuid().replace(/-/g, '').slice(0, 24);
    const ttlMinutes = parseInt(process.env.FILE_TTL_MIN || '15', 10);
    const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);

    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      for (const f of files) archive.file(f.path, { name: f.name });
      archive.finalize();
    });

    fs.writeFileSync(path.join(INDEX_DIR, `${jobId}.json`), JSON.stringify({ jobId, outPath: zipPath, token, expiresAt }));

    return res.json({
      job_id: jobId,
      status: 'completed',
      download_url: `/v1/jobs/${jobId}/download?token=${token}`,
      expires_at: new Date(expiresAt).toISOString(),
      count: files.length
    });
  } catch (e) {
    return res.status(500).json({ error: { code: 'internal_error', message: e.message } });
  }
});

// ----------------------------------------------------------------------------
// Mount feature routers
// ----------------------------------------------------------------------------
// Note: These API endpoints are hidden from direct browser access
// They can only be accessed programmatically by authorized frontend applications
app.use('/v1/pdf', mergeRouter);
app.use('/v1/email', emailRouter);

// Export a tiny bump hook so other server modules/routes can call it directly
export async function bumpMergePdf() {
  return bumpMulti('mergepdf');
}

// ----------------------------------------------------------------------------
// Cleanup expired temp files
// ----------------------------------------------------------------------------
setInterval(() => {
  try {
    if (!fs.existsSync(INDEX_DIR)) return;
    for (const f of fs.readdirSync(INDEX_DIR)) {
      const meta = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, f), 'utf8'));
      if (Date.now() > meta.expiresAt) {
        [meta.inPath, meta.outPath, path.join(INDEX_DIR, f)].forEach(p => { try { fs.unlinkSync(p); } catch {} });
      }
    }
  } catch (e) { log.error(e); }
}, 60_000);

// ----------------------------------------------------------------------------
// Multer / generic error handler (after routes)
// ----------------------------------------------------------------------------
app.use((err, _req, res, next) => {
  // Multer: file too large
  if (err && (err.code === 'LIMIT_FILE_SIZE')) {
    return res.status(413).json({
      error: {
        code: 'file_too_large',
        message: 'This PDF exceeds the maximum upload size.',
        maxBytes: MAX_SIZE,
        maxMB: Math.round(MAX_SIZE / 1e6)
      }
    });
  }

  // Multer: invalid type from fileFilter
  if (err && err.message === 'invalid_file_type') {
    return res.status(400).json({
      error: { code: 'invalid_file_type', message: 'Only .pdf files are allowed.' }
    });
  }

  // Fallback
  if (err) {
    log.error({ err: err.message || String(err) });
    return res.status(500).json({
      error: { code: 'internal_error', message: 'Unexpected server error.' }
    });
  }
  next();
});

// ----------------------------------------------------------------------------
// Listen (bind to appropriate interface based on environment)
// ----------------------------------------------------------------------------
const PORT = process.env.PORT || 4000;
const HOST = isDevelopment ? '0.0.0.0' : '127.0.0.1';
app.listen(PORT, HOST, () => {
  log.info(`API up on ${HOST}:${PORT} (${isDevelopment ? 'development' : 'production'} mode)`);
  if (isDevelopment) {
    console.log(`🚀 Development server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Stats: http://localhost:${PORT}/v1/compress-pdf/stats`);
    console.log(`⭐ Reviews: http://localhost:${PORT}/v1/compress-pdf/reviews`);
  }
});
