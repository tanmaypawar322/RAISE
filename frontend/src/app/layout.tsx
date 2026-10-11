import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

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
    'A neutral, transparent citizen voice platform connecting citizens with responsible public offices. Report • Amplify • Inform • Solve • Escalate.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'RAISE — Report • Amplify • Inform • Solve • Escalate',
    description: 'आपला प्रश्न मांडा, नागरिकांचा पाठिंबा मिळवा, प्रशासनाकडून उत्तर मिळवा.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full bg-gray-50 ${inter.variable} ${notoSansDevanagari.variable}`}>
      <body className="min-h-full flex flex-col text-gray-900 bg-gray-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
