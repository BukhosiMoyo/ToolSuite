import { Router } from 'express';
import { q } from '../db.js';
import { verifySignerToken } from '../lib/crypto.js';

export const sign = Router();

sign.get('/api/sign/:token', async (req, res) => {
  try {
    const tok = verifySignerToken(req.params.token);
    const doc = await q(`select id, title, pdf_url, status from documents where id=$1`, [tok.d]);
    if (!doc.rowCount) return res.status(404).json({ error: 'Not found' });
    const fields = await q(
      `select * from fields where document_id=$1 and (assigned_signer_id is null or assigned_signer_id=$2)`,
      [tok.d, tok.s]
    );
    res.json({ document: doc.rows[0], fields: fields.rows });
  } catch {
    res.status(401).json({ error: 'Invalid or expired link' });
  }
});

sign.post('/api/sign/:token/save', async (req, res) => {
  try {
    const tok = verifySignerToken(req.params.token);
    await q(`insert into events (document_id, signer_id, type, meta_json) values ($1,$2,'partial_save',$3)`,
      [tok.d, tok.s, req.body]);
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: 'Invalid or expired link' });
  }
});

sign.post('/api/sign/:token/finish', async (req, res) => {
  try {
    const tok = verifySignerToken(req.params.token);
    await q(`insert into events (document_id, signer_id, type, meta_json) values ($1,$2,'signed',$3)`,
      [tok.d, tok.s, req.body]);
    await q(`update signers set status='signed', signed_at=now() where id=$1`, [tok.s]);
    res.json({ ok: true });
  } catch {
    res.status(401).json({ error: 'Invalid or expired link' });
  }
});


