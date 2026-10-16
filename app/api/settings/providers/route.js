import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const DATA_FILE = path.join(process.cwd(), 'data', 'providers.json');

export async function POST(req) {
  const body = await req.json();
  const allowed = ['openai', 'mistral', 'claude', 'deepseek', 'grok', 'gemini', 'OPENAI_API_KEY'];
  const out = {};
  for (const k of allowed) {
    if (body[k]) out[k] = body[k];
  }
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(DATA_FILE, JSON.stringify(out, null, 2), { mode: 0o600 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to save' }, { status: 500 });
  }
}
