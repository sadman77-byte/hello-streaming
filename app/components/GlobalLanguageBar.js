'use client';

import LanguageSelector from './LanguageSelector';

export default function GlobalLanguageBar() {
  return (
    <div style={{
      background: '#0f172a',
      borderBottom: '1px solid #334155',
      padding: '4px 12px'
    }}>
      <LanguageSelector />
    </div>
  );
}
