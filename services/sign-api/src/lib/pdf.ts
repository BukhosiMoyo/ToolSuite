import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { sha256Hex } from './crypto.js';

type Cert = {
  title?: string;
  signers: { name: string; email: string; signedAt?: string }[];
  events: { type: string; at: string }[];
};

export async function appendCertificateAndHash(originalBytes: Uint8Array, cert: Cert) {
  const pdf = await PDFDocument.load(originalBytes);
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText('Certificate of Completion', { x: 50, y: 800, size: 18, font });
  if (cert.title) page.drawText(`Document: ${cert.title}`, { x: 50, y: 775, size: 12, font });

  page.drawText('Signers:', { x: 50, y: 750, size: 12, font });
  cert.signers.forEach((s, i) => {
    page.drawText(`• ${s.name} <${s.email}> ${s.signedAt ?? ''}`.trim(), { x: 65, y: 730 - i * 16, size: 11, font });
  });

  page.drawText('Events:', { x: 50, y: 680, size: 12, font });
  cert.events.slice(0, 24).forEach((e, i) => {
    page.drawText(`• ${e.at} – ${e.type}`, { x: 65, y: 660 - i * 14, size: 10, font });
  });

  page.drawText('Integrity (SHA-256 of final PDF):', { x: 50, y: 360, size: 11, font });

  // Save once to compute hash
  const prelim = await pdf.save();
  const hash = sha256Hex(prelim);

  // Draw hash and save final
  const pdf2 = await PDFDocument.load(prelim);
  const p2 = pdf2.getPages().at(-1)!;
  p2.drawText(hash, { x: 50, y: 342, size: 10, font: await pdf2.embedFont(StandardFonts.Helvetica), color: rgb(0,0,0) });
  const final = await pdf2.save();

  return { bytes: final, sha256: sha256Hex(final) };
}

