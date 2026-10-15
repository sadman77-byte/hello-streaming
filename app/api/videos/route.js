import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const videos = db.prepare(
      'SELECT * FROM videos ORDER BY id DESC'
    ).all();

    return NextResponse.json({ videos });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'ভিডিও লোড করা যায়নি' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const videoId = Number(id);

    if (!Number.isSafeInteger(videoId) || videoId < 1) {
      return NextResponse.json(
        { error: 'Invalid video ID' },
        { status: 400 }
      );
    }

    const result = db.prepare(
      'DELETE FROM videos WHERE id = ?'
    ).run(videoId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Could not delete video' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const title = String(body.title || '').trim();
    const url = String(body.url || '').trim();
    const owner = String(body.owner || 'Creator').trim();
    const description = String(body.description || '').trim();

    if (!title || !/^https?:\/\/\S+$/i.test(url)) {
      return NextResponse.json(
        { error: 'সঠিক ভিডিও টাইটেল ও URL দাও' },
        { status: 400 }
      );
    }

    const result = db.prepare(
      'INSERT INTO videos (title, description, url, owner) VALUES (?, ?, ?, ?)'
    ).run(title, description, url, owner);

    return NextResponse.json(
      { success: true, id: result.lastInsertRowid },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST video error:', error);

    return NextResponse.json(
      { error: 'ভিডিও প্রকাশ করা যায়নি' },
      { status: 500 }
    );
  }
}
