// src/routes/merge.js
import { Router } from "express";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { bump as bumpMulti } from '../stats-multi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// outputs folder alongside src/ (i.e., packages/backend/outputs)
const outDir = path.join(__dirname, "..", "..", "outputs");
if (!fssync.existsSync(outDir)) {
  fssync.mkdirSync(outDir, { recursive: true });
}

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

    // Build absolute URL so the frontend doesn't hit Vite by accident
    const rel = `/outputs/${filename}`;
    // For local development, use the backend URL directly
    const host = process.env.NODE_ENV === 'production' ? req.get("host") : 'localhost:4000';
    const absolute_url = `${req.protocol}://${host}${rel}`;
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

    return res.json({ output: { download_url: absolute_url } });
  } catch (err) {
    console.error("merge failed", err);
    return res.status(500).json({ error: { message: "Server error while merging PDFs" } });
  }
});
