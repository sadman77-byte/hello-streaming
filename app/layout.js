import GlobalLanguageBar from './components/GlobalLanguageBar';
import { LanguageProvider } from './components/LanguageProvider';
import './globals.css';

export const metadata = {
  title: 'হ্যালো স্ট্রিমিং',
  description: 'Asia-focused creator video platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>
        <LanguageProvider>
          <GlobalLanguageBar />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
