import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RAISE — Report • Amplify • Inform • Solve • Escalate',
  description:
    'A neutral, independent civic technology platform empowering citizens to Report, Amplify, Inform, Solve, and Escalate local grievances with administrative accountability.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3001'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={`h-full scroll-smooth ${inter.variable} ${notoSansDevanagari.variable}`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900 font-sans antialiased selection:bg-orange-100 selection:text-orange-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:font-bold focus:text-xs"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
