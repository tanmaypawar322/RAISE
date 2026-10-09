import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

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
    <html lang="en" className="h-full bg-gray-50">
      <body className="min-h-full flex flex-col font-sans text-gray-900 bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
