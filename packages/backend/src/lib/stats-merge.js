// packages/backend/src/lib/stats-merge.js
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const DATA_DIR   = path.join(__dirname, '../../data');
const MERGE_PATH = path.join(DATA_DIR, 'merge_stats.json');

async function readMerge() {
  try { return JSON.parse(await fsp.readFile(MERGE_PATH, 'utf8')); }
  catch { return { app:'mergepdf', total:0, updated_at: new Date().toISOString() }; }
}
async function writeMerge(obj) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(MERGE_PATH, JSON.stringify(obj), 'utf8');
}
export async function bumpMergeTotal() {
  const s = await readMerge();
  s.total = (s.total || 0) + 1;
  s.updated_at = new Date().toISOString();
  await writeMerge(s);
  return s;
}
export async function readMergeSummary() {
  return readMerge();
}
