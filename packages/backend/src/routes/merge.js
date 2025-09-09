// src/routes/merge.js
import { Router } from "express";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import { spawn } from "child_process";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4, v4 as uuid } from "uuid";
import { bump as bumpMulti } from '../stats-multi.js';
import pino from "pino";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// outputs folder alongside src/ (i.e., packages/backend/outputs)
const outDir = path.join(__dirname, "..", "..", "outputs");
if (!fssync.existsSync(outDir)) {
  fssync.mkdirSync(outDir, { recursive: true });
}

// Ensure we have the same INDEX_DIR structure as server.js
const TMP_DIR   = path.join(__dirname, "..", "..", "tmp");
const INDEX_DIR = path.join(TMP_DIR, "index");
fssync.mkdirSync(INDEX_DIR, { recursive: true });

// Multer in-memory storage; adjust limits as needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 50, fileSize: 50 * 1024 * 1024 }, // 50 PDFs, 50MB each
});

export const mergeRouter = Router();
const log = pino();

// Limits (override via env)
const MB = 1024 * 1024;
const MAX_FILES = Number(process.env.MERGE_MAX_FILES || 20);
const MAX_TOTAL_MB = Number(process.env.MERGE_MAX_TOTAL_MB || 100);
const MAX_TOTAL_BYTES = MAX_TOTAL_MB * MB;
const MAX_PAGES = Number(process.env.MERGE_MAX_PAGES || 1000);
const MERGE_TIMEOUT_MS = Number(process.env.MERGE_TIMEOUT_MS || 60_000);

/**
 * POST /v1/pdf/merge
 * field: files[] (multiple)
 * response: { output: { download_url: "http://host:port/outputs/merged-<id>.pdf" } }
 */
// Accept either 'files[]' or 'files' for robustness
mergeRouter.post("/merge", (req, res, next) => {
  // First try memory upload for 'files[]'
  upload.array('files[]', 50)(req, res, (err) => {
    if (!err && req.files && req.files.length > 0) return next();
    // Fallback to 'files' field name
    upload.array('files', 50)(req, res, next);
  });
}, async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length < 2) {
      return res.status(422).json({ error: { message: "Need at least 2 PDFs" } });
    }

    // Enforce file count limit
    if (files.length > MAX_FILES) {
      log.warn({ event: 'too_many_files', count: files.length, max: MAX_FILES }, 'merge: too many files');
      return res.status(422).json({ error: { code: 'too_many_files', message: `Too many files. Max allowed is ${MAX_FILES}.` } });
    }

    // Enforce total upload size (in-memory buffers)
    const totalBytes = files.reduce((n, f) => n + (f.size || f.buffer?.length || 0), 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      log.warn({ event: 'payload_too_large', totalBytes, maxBytes: MAX_TOTAL_BYTES }, 'merge: payload too large');
      return res.status(413).json({ error: { code: 'payload_too_large', message: `Combined input exceeds ${MAX_TOTAL_MB}MB.`, maxMB: MAX_TOTAL_MB } });
    }

    // Optional: passwords aligned with files[] indexes and skip flag
    const rawPw = req.body?.["passwords[]"] ?? req.body?.passwords ?? [];
    const passwords = Array.isArray(rawPw) ? rawPw : (rawPw ? [rawPw] : []);
    const skipLocked = String(req.body?.skip_locked || req.body?.skipLocked || 'true') === 'true';

    const merged = await PDFDocument.create();
    let totalPages = 0;
    let usedFileCount = 0;

    // Timeout watchdog
    let timedOut = false;
    const watchdog = setTimeout(() => { timedOut = true; }, MERGE_TIMEOUT_MS);

    async function tryDecryptWithQpdf(buf, password) {
      const inPath = path.join(TMP_DIR, `dec_in_${uuid().slice(0,8)}.pdf`);
      const outPath = path.join(TMP_DIR, `dec_out_${uuid().slice(0,8)}.pdf`);
      await fs.writeFile(inPath, buf);
      const exitCode = await new Promise((resolve) => {
        const args = [
          `--password=${password || ''}`,
          '--decrypt',
          inPath,
          outPath
        ];
        const ps = spawn('qpdf', args);
        ps.on('close', (code) => resolve(code || 0));
        ps.on('error', () => resolve(1));
      });
      try { await fs.unlink(inPath); } catch {}
      if (exitCode !== 0) {
        try { await fs.unlink(outPath); } catch {}
        return null;
      }
      const out = await fs.readFile(outPath);
      try { await fs.unlink(outPath); } catch {}
      return out;
    }

    for (let i = 0; i < files.length; i++) {
      if (timedOut) {
        clearTimeout(watchdog);
        log.error({ event: 'merge_timeout', index: i }, 'merge: timed out');
        return res.status(422).json({ error: { code: 'merge_timeout', message: 'Merging took too long. Please try fewer/smaller PDFs.' } });
      }
      const f = files[i];
      log.info({ event: 'process_file', index: i, name: f.originalname, bytes: f.size }, 'merge: processing file');
      if (!f.mimetype?.includes("pdf") && !f.originalname?.toLowerCase().endsWith(".pdf")) {
        log.warn({ event: 'invalid_type', name: f.originalname, mimetype: f.mimetype }, 'merge: invalid file type');
        return res.status(415).json({ error: { message: "Only PDF files are supported" } });
      }
      let src;
      try {
        src = await PDFDocument.load(f.buffer);
      } catch (e1) {
        // Encrypted or unreadable. Retry with ignoreEncryption.
        try {
          src = await PDFDocument.load(f.buffer, { ignoreEncryption: true });
        } catch (e2) {
          // If a password is provided, try qpdf decryption
          const pw = passwords[i] || passwords[f.originalname] || '';
          if (pw) {
            const decrypted = await tryDecryptWithQpdf(f.buffer, pw);
            if (!decrypted) {
              log.warn({ event: 'invalid_password', name: f.originalname }, 'merge: wrong password');
              return res.status(422).json({ error: { code: 'invalid_password', message: `Wrong password for ${f.originalname}.` } });
            }
            try {
              src = await PDFDocument.load(decrypted);
            } catch {
              log.warn({ event: 'invalid_pdf_after_decrypt', name: f.originalname }, 'merge: unreadable after decrypt');
              return res.status(422).json({ error: { code: 'invalid_pdf_after_decrypt', message: `Could not read ${f.originalname} after decryption.` } });
            }
          } else if (skipLocked) {
            // Skip locked/unreadable file when flag set
            log.warn({ event: 'skip_locked', name: f.originalname }, 'merge: skipping locked file');
            continue;
          } else {
            log.warn({ event: 'invalid_or_encrypted_pdf', name: f.originalname }, 'merge: invalid/encrypted without password');
            return res.status(422).json({ error: { code: 'invalid_or_encrypted_pdf', message: `Cannot read PDF: ${f.originalname}. It may be corrupted or password-protected.` } });
          }
        }
      }
      const pageIndices = src.getPageIndices();
      // Enforce page limit
      if (totalPages + pageIndices.length > MAX_PAGES) {
        clearTimeout(watchdog);
        log.warn({ event: 'too_many_pages', pagesSoFar: totalPages, nextFilePages: pageIndices.length, maxPages: MAX_PAGES }, 'merge: too many pages');
        return res.status(422).json({ error: { code: 'too_many_pages', message: `Total pages exceed limit of ${MAX_PAGES}.` } });
      }
      const pages = await merged.copyPages(src, pageIndices);
      totalPages += pageIndices.length;
      pages.forEach(p => merged.addPage(p));
      usedFileCount += 1;
    }

    if (usedFileCount < 2) {
      clearTimeout(watchdog);
      return res.status(422).json({ error: { code: 'not_enough_files_after_skip', message: 'Not enough valid PDFs to merge after skipping locked files.' } });
    }

    const bytes = await merged.save();
    clearTimeout(watchdog);
    const id = uuidv4();
    const filename = `merged-${id}.pdf`;
    const absPath = path.join(outDir, filename);
    await fs.writeFile(absPath, bytes);

    // ✅ create a short-lived job and return a tokenized download_url
    const jobId = `mpdf_${uuid().slice(0, 8)}`;
    const token = uuid().replace(/-/g, '').slice(0, 24);
    const ttlMinutes = parseInt(process.env.FILE_TTL_MIN || '60', 10);
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

    // If you already computed pages, keep it; otherwise set null
    const pages = typeof totalPages === 'number' ? totalPages : null;
    
    // ✅ Calculate file size and store in metadata
    const outSize = fssync.existsSync(absPath) ? fssync.statSync(absPath).size : null;

    fssync.writeFileSync(
      path.join(INDEX_DIR, `${jobId}.json`),
      JSON.stringify({ jobId, outPath: absPath, token, expiresAt, pages, bytes: outSize })
    );
    try {
      // Prefer direct import if available, otherwise POST to the internal bump endpoint
      if (typeof bumpMulti === 'function') {
        await bumpMulti('mergepdf');
      } else {
        // server-side HTTP bump (non-fatal). Uses PORT env or 4000 default.
        await fetch(`http://127.0.0.1:${process.env.PORT || 4000}/v1/mergepdf/stats/bump`, { method: 'POST' });
      }
    } catch (e) { /* non-fatal */ }

    if (typeof bumpMergeTotal === 'function') await bumpMergeTotal();

    log.info({ event: 'merge_complete', outputBytes: bytes.length, totalPages, usedFiles: usedFileCount }, 'merge: completed');
    return res.json({
      status: 'completed',
      output: {
        filename: path.basename(absPath),
        bytes: outSize,
        // ✅ RELATIVE URL so we never leak 'http://localhost:4000' in prod
        download_url: `/v1/jobs/${jobId}/download?token=${token}`,
        meta_url: `/v1/meta/${jobId}`,
        expires_at: new Date(expiresAt).toISOString()
      }
    });
  } catch (err) {
    console.error("merge failed", err);
    return res.status(500).json({ error: { message: "Server error while merging PDFs" } });
  }
});
