// src/routes/merge.js
import { Router } from "express";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4, v4 as uuid } from "uuid";
import { bump as bumpMulti } from '../stats-multi.js';

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

/**
 * POST /v1/pdf/merge
 * field: files[] (multiple)
 * response: { output: { download_url: "http://host:port/outputs/merged-<id>.pdf" } }
 */
mergeRouter.post("/merge", upload.array("files[]", 50), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length < 2) {
      return res.status(422).json({ error: { message: "Need at least 2 PDFs" } });
    }

    const merged = await PDFDocument.create();

    for (const f of files) {
      if (!f.mimetype?.includes("pdf") && !f.originalname?.toLowerCase().endsWith(".pdf")) {
        return res.status(415).json({ error: { message: "Only PDF files are supported" } });
      }
      const src = await PDFDocument.load(f.buffer /*, { ignoreEncryption: true } */);
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    }

    const bytes = await merged.save();
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

    fssync.writeFileSync(
      path.join(INDEX_DIR, `${jobId}.json`),
      JSON.stringify({ jobId, outPath: absPath, token, expiresAt, pages })
    );

    const outSize = fssync.existsSync(absPath) ? fssync.statSync(absPath).size : null;
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
