import { Language, MarketingTranslations } from './types';
import { en } from './en';
import { mr } from './mr';
import { hi } from './hi';

export * from './types';
export { en, mr, hi };

export const supportedLanguages: Language[] = ['en', 'mr', 'hi'];

export function getDictionary(lang: Language | string): MarketingTranslations {
  if (lang === 'mr') return mr;
  if (lang === 'hi') return hi;
  return en;
}

export function isValidLanguage(lang: string): lang is Language {
  return supportedLanguages.includes(lang as Language);
}
