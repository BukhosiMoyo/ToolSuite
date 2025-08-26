// src/stats-multi.js
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const FILE = path.join(DATA_DIR, 'stats-multi.json');

async function readAll() {
  try {
    const txt = await fsp.readFile(FILE, 'utf8');
    return JSON.parse(txt);
  } catch {
    return { mergepdf: { total: 0, updated_at: new Date().toISOString() },
             compresspdf: { total: 0, updated_at: new Date().toISOString() } };
  }
}
async function writeAll(obj) {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  await fsp.writeFile(FILE, JSON.stringify(obj), 'utf8');
}

export async function bump(appKey) {
  const all = await readAll();
  const key = appKey || 'mergepdf';
  if (!all[key]) all[key] = { total: 0, updated_at: new Date().toISOString() };
  all[key].total = (all[key].total || 0) + 1;
  all[key].updated_at = new Date().toISOString();
  await writeAll(all);
  return all[key];
}

export async function summary(appKey) {
  const all = await readAll();
  const key = appKey || 'mergepdf';
  const s = all[key] || { total: 0, updated_at: new Date().toISOString() };
  return { app: key, total: s.total || 0, updated_at: s.updated_at };
}
