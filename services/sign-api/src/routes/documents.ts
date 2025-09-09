import { Router } from 'express';
import { q } from '../db.js';
import { z } from 'zod';
import { saveFile } from '../lib/storage.js';

export const documents = Router();

const CreateBody = z.object({
  ownerId: z.string().uuid(),
  title: z.string().optional(),
  pdfBase64: z.string(),
});

documents.post('/api/documents', async (req, res) => {
  const body = CreateBody.parse(req.body);
  const bytes = Buffer.from(body.pdfBase64, 'base64');
  const url = await saveFile(bytes, (body.title ?? 'document') + '.pdf');
  const doc = await q(
    `insert into documents (owner_id, title, pdf_url) values ($1,$2,$3) returning id, title, pdf_url, status`,
    [body.ownerId, body.title ?? null, url]
  );
  await q(`insert into events (document_id, type, meta_json) values ($1,'created','{}')`, [doc.rows[0].id]);
  res.json(doc.rows[0]);
});

documents.get('/api/documents/:id', async (req, res) => {
  const doc = await q(`select * from documents where id=$1`, [req.params.id]);
  if (!doc.rowCount) return res.status(404).json({ error: 'Not found' });
  const fields = await q(`select * from fields where document_id=$1`, [req.params.id]);
  const signers = await q(`select * from signers where document_id=$1 order by role_index asc`, [req.params.id]);
  res.json({ document: doc.rows[0], fields: fields.rows, signers: signers.rows });
});

documents.post('/api/documents/:id/fields', async (req, res) => {
  const { fields } = req.body as { fields: any[] };
  await q('delete from fields where document_id=$1', [req.params.id]);
  for (const f of fields) {
    await q(
      `insert into fields (document_id, assigned_signer_id, type, page, x, y, w, h, rotate, required, placeholder, color, font_key, size_pt, locked_at_send)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [req.params.id, f.assignedSignerId ?? null, f.type, f.page, f.x, f.y, f.w, f.h, f.rotate ?? 0,
       !!f.required, f.placeholder ?? null, f.color ?? null, f.fontKey ?? null, f.sizePt ?? null, !!f.lockedAtSend]
    );
  }
  await q(`insert into events (document_id, type, meta_json) values ($1,'fields_updated','{}')`, [req.params.id]);
  res.json({ ok: true });
});


