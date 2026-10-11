'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Language, NavContent } from '../../content/i18n/types';
import { appUrl } from '../lib/app-url';
import { ArrowRight, Menu, X, Globe } from 'lucide-react';

interface NavbarProps {
  lang: Language;
  content: NavContent;
}

export function Navbar({ lang, content }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: `/${lang}`, label: content.home },
    { href: `/${lang}/how-it-works`, label: content.howItWorks },
    { href: `/${lang}/for-citizens`, label: content.forCitizens },
    { href: `/${lang}/for-offices`, label: content.forOffices },
    { href: `/${lang}/privacy-and-safety`, label: content.privacy },
    { href: `/${lang}/faq`, label: content.faq },
    { href: `/${lang}/about`, label: content.about },
  ];

  const languages: { code: Language; label: string }[] = [
    { code: 'mr', label: 'मराठी' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'en', label: 'English' },
  ];

  // Helper to switch language while staying on the same sub-path
  const getLangSwitchUrl = (targetLang: Language) => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0 || segments[0] === 'en' || segments[0] === 'mr' || segments[0] === 'hi') {
      segments[0] = targetLang;
    } else {
      segments.unshift(targetLang);
    }
    return `/${segments.join('/')}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <Link href={`/${lang}`} className="flex items-center gap-3 shrink-0 focus-visible:ring-2 focus-visible:ring-orange-600 rounded-xl">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-600 flex items-center justify-center text-white font-extrabold text-xl shadow-xs">
            R
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg sm:text-xl text-gray-900 tracking-tight">
                <span className="text-orange-600">RAISE</span>
              </span>
              <span className="text-[10px] bg-orange-100 text-orange-950 font-extrabold px-1.5 py-0.5 rounded tracking-wider">
                CIVIC TECH
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium hidden sm:block">
              Report • Amplify • Inform • Solve • Escalate
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-gray-600" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== `/${lang}` && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`py-1 transition-colors hover:text-orange-600 ${
                  isActive ? 'text-orange-600 border-b-2 border-orange-600 font-bold' : ''
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Language Switcher & App Links */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {/* Language Switcher */}
          <div className="inline-flex items-center p-0.5 bg-gray-100 rounded-xl border border-gray-200" role="group" aria-label="Language Selector">
            {languages.map((l) => (
              <Link
                key={l.code}
                href={getLangSwitchUrl(l.code)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  lang === l.code ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Sign In Button */}
          <a
            href={appUrl('/sign-in', lang)}
            className="px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-orange-600 transition"
          >
            {content.signIn}
          </a>

          {/* Primary CTA: Get Started */}
          <a
            href={appUrl('/sign-up', lang)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition hover:shadow-md"
          >
            <span>{content.getStarted}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Language Switcher for Mobile */}
          <div className="inline-flex items-center p-0.5 bg-gray-100 rounded-lg border border-gray-200">
            {languages.map((l) => (
              <Link
                key={l.code}
                href={getLangSwitchUrl(l.code)}
                className={`px-2 py-1 text-[11px] font-bold rounded-md ${
                  lang === l.code ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  pathname === link.href ? 'bg-orange-50 text-orange-600' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <a
              href={appUrl('/sign-up', lang)}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold text-center shadow-xs flex items-center justify-center gap-2"
            >
              <span>{content.getStarted}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={appUrl('/sign-in', lang)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold text-center"
            >
              {content.signIn}
            </a>
            <div className="pt-2 flex items-center justify-between text-xs text-gray-500 px-1">
              <span>{content.forOffices}:</span>
              <a href={appUrl('/office/request-access', lang)} className="text-orange-600 font-bold hover:underline">
                {content.requestOfficeAccess}
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
