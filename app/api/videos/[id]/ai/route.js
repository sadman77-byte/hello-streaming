import { NextResponse } from 'next/server';
import db from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const videoId = Number(id);

    if (!Number.isSafeInteger(videoId) || videoId < 1) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const video = db.prepare(`
      SELECT id, title, transcript, summary, summary_language, ai_updated_at
      FROM videos WHERE id = ?
    `).get(videoId);

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Load video AI data error:', error);
    return NextResponse.json({ error: 'Could not load video AI data' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const videoId = Number(id);

    if (!Number.isSafeInteger(videoId) || videoId < 1) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
    }

    const body = await request.json();
    const allowed = ['transcript', 'summary', 'summary_language'];
    const updates = {};

    for (const key of allowed) {
      if (Object.hasOwn(body, key)) {
        if (typeof body[key] !== 'string') {
          return NextResponse.json({ error: `${key} must be text` }, { status: 400 });
        }
        const maxLength = key === 'transcript' ? 200000 : 50000;
        if (body[key].length > maxLength) {
          return NextResponse.json({ error: `${key} is too long` }, { status: 413 });
        }
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields supplied' }, { status: 400 });
    }

    if (updates.summary_language &&
        !['bn', 'en'].includes(updates.summary_language)) {
      return NextResponse.json({ error: 'Language must be bn or en' }, { status: 400 });
    }

    const exists = db.prepare('SELECT id FROM videos WHERE id = ?').get(videoId);
    if (!exists) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const fields = Object.keys(updates);
    const assignments = fields.map((field) => `${field} = @${field}`);
    assignments.push('ai_updated_at = CURRENT_TIMESTAMP');

    db.prepare(
      `UPDATE videos SET ${assignments.join(', ')} WHERE id = @id`
    ).run({ ...updates, id: videoId });

    const video = db.prepare(`
      SELECT id, title, transcript, summary, summary_language, ai_updated_at
      FROM videos WHERE id = ?
    `).get(videoId);

    return NextResponse.json({ success: true, video });
  } catch (error) {
    console.error('Save video AI data error:', error);
    return NextResponse.json({ error: 'Could not save video AI data' }, { status: 500 });
  }
}
