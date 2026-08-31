import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '0ther5ide — Intelligence Terminal',
  description: 'Global intelligence terminal — live conflict data, market signals, insider activity.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <div className="scanline" />
      </body>
    </html>
  );
}