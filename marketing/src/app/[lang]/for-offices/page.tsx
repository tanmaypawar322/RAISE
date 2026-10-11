import React from 'react';
import { notFound } from 'next/navigation';
import { Language, getDictionary, isValidLanguage } from '../../../../content/i18n';
import { appUrl } from '../../../lib/app-url';
import {
  Building2,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  HardHat,
  Clock,
  Award,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function ForOfficesPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  const dict = getDictionary(lang as Language);
  const { forOffices } = dict;

  return (
    <div className="py-12 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-950 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-blue-200">
            <Building2 className="w-3.5 h-3.5 text-blue-900" />
            <span>{forOffices.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mt-2 mb-4">
            {forOffices.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {forOffices.subtitle}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-16">
          {forOffices.benefits.map((benefit, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs mb-3">
                  0{index + 1}
                </div>
                <h2 className="font-bold text-base text-gray-900 mb-2">
                  {benefit.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 3 Sections: Cost, Verification, Contractor / Agencies */}
        <div className="space-y-6 mb-16">
          {/* Zero Cost Response */}
          <div className="p-6 sm:p-8 rounded-3xl bg-blue-50/50 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-blue-900" />
              <h2 className="text-xl font-bold text-gray-900">
                {forOffices.costTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {forOffices.costDesc}
            </p>
          </div>

          {/* Verification Process */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {forOffices.verificationTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {forOffices.verificationDesc}
            </p>
          </div>

          {/* Contractors & Agencies Partner Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/60 border border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <HardHat className="w-6 h-6 text-amber-700" />
              <h2 className="text-xl font-bold text-gray-900">
                {forOffices.contractorTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {forOffices.contractorDesc}
            </p>
          </div>
        </div>

        {/* CTA Card for Offices */}
        <div className="p-8 sm:p-12 rounded-3xl bg-blue-950 text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            Register Your Department or Claim an Office Profile
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 max-w-lg mx-auto mb-8">
            Submit your official government or agency credentials for review. Our verification team authenticates every request before granting access.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={appUrl('/office/request-access', lang as Language)}
              className="w-full sm:w-auto px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <span>{forOffices.ctaButton}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={appUrl('/office/sign-in', lang as Language)}
              className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-semibold transition"
            >
              {forOffices.signInLink}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
