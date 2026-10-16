import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';

export async function GET(req, { params }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  db.exec('CREATE TABLE IF NOT EXISTS subscriptions(video_id INTEGER PRIMARY KEY, subscribed_at TEXT)');
  const row = db.prepare('SELECT * FROM subscriptions WHERE video_id = ?').get(id);
  return NextResponse.json({ subscribed: !!row });
}

export async function POST(req, { params }) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  db.exec('CREATE TABLE IF NOT EXISTS subscriptions(video_id INTEGER PRIMARY KEY, subscribed_at TEXT)');
  const row = db.prepare('SELECT * FROM subscriptions WHERE video_id = ?').get(id);
  if (row) {
    db.prepare('DELETE FROM subscriptions WHERE video_id = ?').run(id);
    return NextResponse.json({ subscribed: false });
  } else {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO subscriptions(video_id, subscribed_at) VALUES (?, ?)').run(id, now);
    return NextResponse.json({ subscribed: true });
  }
}
