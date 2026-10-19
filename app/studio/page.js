'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

export default function StudioPage() {
  const [videos, setVideos] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/videos', {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ভিডিও লোড করা যায়নি');
      }

      setVideos(Array.isArray(data.videos) ? data.videos : []);
    } catch (error) {
      setMessage(error.message || 'ভিডিও লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  async function deleteVideo(video) {
    const confirmed = window.confirm(
      `"${video.title}" ভিডিওটি স্থায়ীভাবে মুছতে চাও?`
    );

    if (!confirmed) return;

    setMessage('');

    try {
      const response = await fetch('/api/videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: video.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ভিডিও মুছতে ব্যর্থ');
      }

      setVideos((current) =>
        current.filter((item) => item.id !== video.id)
      );

      setMessage('ভিডিও সফলভাবে মুছে ফেলা হয়েছে।');
    } catch (error) {
      setMessage(error.message || 'নেটওয়ার্ক সমস্যা হয়েছে');
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Link href="/" style={styles.homeLink}>
          ← হোমে ফিরুন
        </Link>

        <h1 style={styles.heading}>Creator Studio</h1>
        <p style={styles.muted}>
          তোমার প্রকাশিত ভিডিওগুলো পরিচালনা করো।
        </p>

        <div style={styles.actions}>
          <Link href="/ai-studio" style={styles.button}>AI Transcript Studio (Pollinations)</Link>
          <button onClick={loadVideos} style={styles.button}>
            Refresh
          </button>

          <Link href="/" style={styles.button}>
            নতুন ভিডিও প্রকাশ
          </Link>
        </div>

        {message && <p role="status" style={styles.message}>{message}</p>}

        {loading ? (
          <p>ভিডিও লোড হচ্ছে...</p>
        ) : videos.length === 0 ? (
          <p>এখনো কোনো ভিডিও নেই।</p>
        ) : (
          <section style={styles.list}>
            {videos.map((video) => (
              <article key={video.id} style={styles.card}>
                <h2 style={styles.videoTitle}>
                  {video.title || 'Untitled video'}
                </h2>

                <p style={styles.muted}>
                  ID: {video.id} · Owner: {video.owner || 'Creator'}
                </p>

                {video.description && <p>{video.description}</p>}

                <p style={styles.url}>{video.url}</p>

                <div style={styles.actions}>
                  <Link href={`/watch/${video.id}`} style={styles.button}>
                    Watch
                  </Link>

                  <button
                    onClick={() => deleteVideo(video)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0b1020',
    color: '#f8fafc',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  heading: {
    fontSize: '30px',
    margin: '24px 0 8px',
  },
  muted: {
    color: '#94a3b8',
  },
  homeLink: {
    color: '#93c5fd',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    margin: '20px 0',
  },
  button: {
    background: '#2563eb',
    color: '#ffffff',
    border: 0,
    borderRadius: '8px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '15px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  deleteButton: {
    background: '#991b1b',
    color: '#ffffff',
    border: 0,
    borderRadius: '8px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '15px',
  },
  message: {
    background: '#1e293b',
    padding: '12px',
    borderRadius: '8px',
    overflowWrap: 'anywhere',
  },
  list: {
    display: 'grid',
    gap: '14px',
  },
  card: {
    background: '#111827',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '16px',
  },
  videoTitle: {
    fontSize: '20px',
    margin: '0 0 8px',
  },
  url: {
    color: '#cbd5e1',
    overflowWrap: 'anywhere',
  },
};
