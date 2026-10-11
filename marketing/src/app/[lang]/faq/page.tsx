import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Language, getDictionary, isValidLanguage } from '../../../../content/i18n';
import { Accordion } from '../../../components/Accordion';
import { HelpCircle, ArrowRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function FaqPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  const dict = getDictionary(lang as Language);
  const { faq } = dict;

  return (
    <div className="py-12 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-950 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-orange-200">
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            <span>{faq.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mt-2 mb-4">
            {faq.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {faq.subtitle}
          </p>
        </div>

        {/* All FAQ Items */}
        <Accordion
          items={faq.items.map((item, index) => ({
            id: `faq-${index}`,
            question: item.question,
            answer: item.answer,
          }))}
        />

        {/* More Questions Box */}
        <div className="mt-16 p-8 rounded-3xl bg-gray-50 border border-gray-200 text-center">
          <h2 className="font-bold text-base text-gray-900 mb-2">
            {faq.moreQuestionsText}
          </h2>
          <Link
            href={`/${lang}/contact`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            <span>{faq.contactLinkText}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
