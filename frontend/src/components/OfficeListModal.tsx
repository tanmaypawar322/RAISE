'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { X, Building2, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface OfficeListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfficeListModal({ isOpen, onClose }: OfficeListModalProps) {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const pilotOffices = [
    {
      id: '1',
      name: "PCMC Ward 'A' Zonal Office",
      nameMr: 'पिं.चिं.म.न.पा. ‘अ’ क्षेत्रीय कार्यालय (निगडी, आकुर्डी, प्राधिकरण)',
      department: 'general',
      level: 'Ward Level',
      claimStatus: 'unclaimed',
      issuesTotal: 18,
      issuesResolved: 7,
      responseRate: '38%',
    },
    {
      id: '2',
      name: 'PCMC Water Supply & Drainage Department',
      nameMr: 'पिं.चिं.म.न.पा. पाणी पुरवठा व जलनिस्सारण विभाग',
      department: 'water',
      level: 'Municipal Corporation',
      claimStatus: 'unclaimed',
      issuesTotal: 42,
      issuesResolved: 19,
      responseRate: '45%',
    },
    {
      id: '3',
      name: 'PCMC Road Maintenance & Civil Department',
      nameMr: 'पिं.चिं.म.न.पा. रस्ते व स्थापत्य देखभाल विभाग',
      department: 'roads',
      level: 'Municipal Corporation',
      claimStatus: 'unclaimed',
      issuesTotal: 31,
      issuesResolved: 12,
      responseRate: '39%',
    },
    {
      id: '4',
      name: 'PCMC Health & Sanitation Department',
      nameMr: 'पिं.चिं.म.न.पा. मुख्य आरोग्य व घनकचरा व्यवस्थापन विभाग',
      department: 'sanitation',
      level: 'Municipal Corporation',
      claimStatus: 'unclaimed',
      issuesTotal: 24,
      issuesResolved: 14,
      responseRate: '58%',
    },
    {
      id: '5',
      name: 'MSEDCL Pimpri Division (Electricity)',
      nameMr: 'महावितरण पिंपरी विभाग (विद्युत पुरवठा)',
      department: 'electricity',
      level: 'State Utility',
      claimStatus: 'unclaimed',
      issuesTotal: 15,
      issuesResolved: 9,
      responseRate: '60%',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {t('officeScorecard')}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('officesSubtitle')}
          </p>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {pilotOffices.map((office) => (
            <div
              key={office.id}
              className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-white hover:border-orange-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    {language === 'mr' ? office.nameMr : office.name}
                  </h3>
                  <span className="text-[11px] text-gray-500">{office.level}</span>
                </div>
                <span className="self-start sm:self-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {t('officeUnclaimed')}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 text-center">
                <div className="bg-white p-2 rounded-lg border border-gray-100">
                  <div className="text-[10px] text-gray-500">{t('totalIssues')}</div>
                  <div className="text-sm font-bold text-gray-900">{office.issuesTotal}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-gray-100">
                  <div className="text-[10px] text-gray-500">{t('resolvedIssues')}</div>
                  <div className="text-sm font-bold text-emerald-700">{office.issuesResolved}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-gray-100">
                  <div className="text-[10px] text-gray-500">{t('responseRate')}</div>
                  <div className="text-sm font-bold text-orange-600">{office.responseRate}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
