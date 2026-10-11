import React from 'react';
import Link from 'next/link';
import { Language, FooterContent, NavContent } from '../../content/i18n/types';
import { appUrl } from '../lib/app-url';
import { Shield } from 'lucide-react';

interface FooterProps {
  lang: Language;
  content: FooterContent;
  navContent: NavContent;
}

export function Footer({ lang, content, navContent }: FooterProps) {
  const languages: { code: Language; label: string }[] = [
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'English' },
  ];

  return (
    <footer className="mt-auto bg-gray-950 text-gray-400 border-t border-gray-900 py-12 lg:py-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-gray-800">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                R
              </div>
              <div>
                <span className="font-extrabold text-white text-base tracking-tight">
                  <span className="text-orange-500">RAISE</span>
                </span>
                <span className="ml-2 text-[10px] bg-white/10 text-orange-300 font-bold px-1.5 py-0.5 rounded">
                  CIVIC TECH
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 max-w-md leading-relaxed">
              {content.tagline}
            </p>

            <p className="text-[11px] text-gray-500 max-w-md leading-relaxed">
              {content.initiativeNotice}
            </p>

            {/* Language Switcher in Footer */}
            <div className="pt-2 flex items-center gap-2">
              <span className="text-[11px] text-gray-400">Language / भाषा:</span>
              <div className="inline-flex items-center gap-1.5">
                {languages.map((l) => (
                  <Link
                    key={l.code}
                    href={`/${l.code}`}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                      lang === l.code ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              {content.linksTitle}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${lang}`} className="hover:text-white transition">
                  {navContent.home}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/how-it-works`} className="hover:text-white transition">
                  {navContent.howItWorks}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/for-citizens`} className="hover:text-white transition">
                  {navContent.forCitizens}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/for-offices`} className="hover:text-white transition">
                  {navContent.forOffices}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/privacy-and-safety`} className="hover:text-white transition">
                  {navContent.privacy}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/faq`} className="hover:text-white transition">
                  {navContent.faq}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/about`} className="hover:text-white transition">
                  {navContent.about}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/contact`} className="hover:text-white transition">
                  {navContent.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & App Links (Directing to App) */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              {content.legalTitle}
            </h3>
            <ul className="space-y-2">
              <li>
                <a href={appUrl('/terms', lang)} className="hover:text-white transition">
                  {content.terms}
                </a>
              </li>
              <li>
                <a href={appUrl('/privacy', lang)} className="hover:text-white transition">
                  {content.privacyPolicy}
                </a>
              </li>
              <li>
                <a href={appUrl('/community-guidelines', lang)} className="hover:text-white transition">
                  {content.communityGuidelines}
                </a>
              </li>
              <li>
                <a href={appUrl('/grievance-redressal', lang)} className="hover:text-white transition">
                  {content.grievanceOfficer}
                </a>
              </li>
              <li className="pt-2">
                <a
                  href={appUrl('/sign-in', lang)}
                  className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-bold"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{content.openApp}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>{content.rights}</div>
          <div className="flex items-center gap-4">
            <a href={appUrl('/office/sign-in', lang)} className="hover:text-gray-300 transition">
              {navContent.officialSignIn}
            </a>
            <span>&bull;</span>
            <a href={appUrl('/office/request-access', lang)} className="hover:text-gray-300 transition">
              {navContent.requestOfficeAccess}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
