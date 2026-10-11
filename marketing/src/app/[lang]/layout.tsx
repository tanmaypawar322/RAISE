import React from 'react';
import { notFound } from 'next/navigation';
import { Language, getDictionary, isValidLanguage, supportedLanguages } from '../../../content/i18n';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export function generateStaticParams() {
  return supportedLanguages.map((lang) => ({ lang }));
}

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  if (!isValidLanguage(lang)) {
    notFound();
  }

  const dict = getDictionary(lang as Language);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar lang={lang as Language} content={dict.nav} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer lang={lang as Language} content={dict.footer} navContent={dict.nav} />
    </div>
  );
}
