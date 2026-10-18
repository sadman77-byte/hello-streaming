'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch((error) => console.warn('Service worker registration failed:', error));
    }
  }, []);
  return null;
}
