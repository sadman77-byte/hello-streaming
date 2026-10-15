'use client';

import { useLanguage } from './LanguageProvider';

export default function LanguageSelector() {
  const { language, changeLanguage, t } = useLanguage();

  return (
    <div style={{
      padding: '16px',
      background: '#172033',
      borderRadius: '12px',
      color: 'white',
      maxWidth: '350px',
      margin: '20px auto'
    }}>
      <label
        htmlFor="language"
        style={{ display: 'block', marginBottom: '10px' }}
      >
        🌐 {t('language')} / ভাষা / भाषा
      </label>

      <select
        id="language"
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          background: '#0b1020',
          color: 'white',
          border: '1px solid #475569'
        }}
      >
        <option value="en">English</option>
        <option value="bn">বাংলা</option>
        <option value="hi">हिन्दी</option>
      </select>

      <p style={{ marginTop: '12px' }}>
        {t('home')} · {t('studio')} · {t('settings')}
      </p>
    </div>
  );
}
