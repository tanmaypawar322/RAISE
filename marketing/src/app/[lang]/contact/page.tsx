import React from 'react';
import { notFound } from 'next/navigation';
import { Language, getDictionary, isValidLanguage } from '../../../../content/i18n';
import { appUrl } from '../../../lib/app-url';
import { Mail, Shield, AlertCircle, FileText } from 'lucide-react';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function ContactPage({ params }: PageProps) {
  const { lang } = await params;
  if (!isValidLanguage(lang)) notFound();

  const dict = getDictionary(lang as Language);
  const { contact } = dict;

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@lokawaaz-raise.org';

  const grievanceOfficerName = process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME;
  const grievanceOfficerEmail = process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL;
  const grievanceOfficerAddress = process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_ADDRESS;

  const hasGrievanceOfficer = Boolean(grievanceOfficerName || grievanceOfficerEmail);

  return (
    <div className="py-12 sm:py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-950 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-orange-200">
            <Mail className="w-3.5 h-3.5 text-orange-600" />
            <span>{contact.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mt-2 mb-4">
            {contact.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            {contact.subtitle}
          </p>
        </div>

        {/* Support Email Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gray-50 border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {contact.supportEmailTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
            {contact.supportEmailDesc}
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-block text-lg sm:text-xl font-black text-orange-600 hover:text-orange-700 hover:underline"
          >
            {contactEmail}
          </a>
        </div>

        {/* Statutory Grievance Officer Block */}
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-gray-200 shadow-2xs mb-12">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {contact.grievanceOfficerTitle}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
            {contact.grievanceOfficerDesc}
          </p>

          {hasGrievanceOfficer ? (
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs sm:text-sm text-gray-800">
              {grievanceOfficerName && (
                <div>
                  <strong>Designation / Name:</strong> {grievanceOfficerName}
                </div>
              )}
              {grievanceOfficerEmail && (
                <div>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${grievanceOfficerEmail}`} className="text-orange-600 hover:underline">
                    {grievanceOfficerEmail}
                  </a>
                </div>
              )}
              {grievanceOfficerAddress && (
                <div>
                  <strong>Postal Address:</strong> {grievanceOfficerAddress}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3 text-xs text-gray-600">
              <AlertCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{contact.grievanceOfficerConfigPending}</span>
            </div>
          )}
        </div>

        {/* Legal Link Footer */}
        <div className="text-center text-xs text-gray-500">
          {contact.legalNotice}{' '}
          <a href={appUrl('/terms', lang as Language)} className="text-orange-600 font-bold hover:underline">
            Terms of Service
          </a>{' '}
          &bull;{' '}
          <a href={appUrl('/privacy', lang as Language)} className="text-orange-600 font-bold hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
