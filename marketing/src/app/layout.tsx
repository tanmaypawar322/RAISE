import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RAISE — Report • Amplify • Inform • Solve • Escalate',
  description:
    'A neutral, independent civic technology platform empowering citizens to Report, Amplify, Inform, Solve, and Escalate local grievances with administrative accountability.',
  openGraph: {
    title: 'RAISE — Report • Amplify • Inform • Solve • Escalate',
    description: 'Better governance, transparency, and accountability for every citizen.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
