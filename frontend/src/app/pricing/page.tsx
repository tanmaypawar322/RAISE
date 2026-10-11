'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { Header } from '../../components/Header';
import {
  ShieldCheck,
  Check,
  Building,
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Lock,
  Download,
} from 'lucide-react';

export default function PricingPage() {
  const { t, language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      key: 'citizen',
      name: language === 'mr' ? 'नागरिक' : language === 'hi' ? 'नागरिक' : 'Citizen',
      price: '₹0',
      period: language === 'mr' ? 'कायमस्वरूपी' : language === 'hi' ? 'हमेशा' : 'Forever',
      badge: language === 'mr' ? 'नागरिकांसाठी' : language === 'hi' ? 'नागरिकों हेतु' : 'For Citizens',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description:
        language === 'mr'
          ? 'तक्रार नोंदवणे, पाठिंबा देणे (Raise) आणि पाठपुरावा सर्व नागरिकांसाठी विनामूल्य.'
          : language === 'hi'
          ? 'मुद्दा उठाना, समर्थन देना और ट्रैकिंग सभी नागरिकों के लिए पूरी तरह से मुफ्त।'
          : 'Reporting, raising, tracking, escalation drafts, and public participation are free forever.',
      features: [
        language === 'mr' ? 'अमर्याद नागरी समस्या नोंदणी' : language === 'hi' ? 'असीमित नागरिक मुद्दे' : 'Unlimited issue reporting & raising',
        language === 'mr' ? 'थेट प्रशासकीय पाठपुरावा व ट्रॅकिंग' : language === 'hi' ? 'सीधा प्रशासनिक ट्रैकिंग' : 'Live department SLA clock tracking',
        language === 'mr' ? 'CPGRAMS / RTI मसुदा' : language === 'hi' ? 'CPGRAMS / RTI ड्राफ्ट' : '1-click CPGRAMS / RTI escalation drafts',
        language === 'mr' ? 'स्थानिक लोकप्रतिनिधी विचारणा' : language === 'hi' ? 'स्थानीय प्रतिनिधि पूछताछ' : 'Local representative inquiry requests',
      ],
      isFree: true,
      actionText: language === 'mr' ? 'तक्रार नोंदवा' : language === 'hi' ? 'मुद्दा उठाएं' : 'Raise an Issue',
      actionHref: '/',
    },
    {
      key: 'office_basic',
      name: language === 'mr' ? 'मूलभूत कार्यालय' : language === 'hi' ? 'मूल कार्यालय' : 'Office Basic',
      price: '₹0',
      period: language === 'mr' ? 'विनामूल्य' : language === 'hi' ? 'निःशुल्क' : 'Free Forever',
      badge: language === 'mr' ? 'सर्व कार्यालये' : language === 'hi' ? 'सभी कार्यालय' : 'All Offices',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description:
        language === 'mr'
          ? 'सर्व शासकीय व प्रभाग कार्यालयांसाठी नागरिक तक्रारींना प्रतिसाद देण्याचे पूर्ण अधिकार.'
          : language === 'hi'
          ? 'सभी वार्ड एवं विभागीय कार्यालयों के लिए नागरिक शिकायतों का उत्तर देने का पूर्ण साधन।'
          : 'Official verified profile, status updates, citizen resolution notes, and monthly reports.',
      features: [
        language === 'mr' ? 'अधिकृत कार्यालय प्रोफाइल पडताळणी' : language === 'hi' ? 'आधिकारिक कार्यालय सत्यापन' : 'Verified official office profile',
        language === 'mr' ? 'तक्रारींवर अधिकृत कारवाई व स्थिती बदल' : language === 'hi' ? 'आधिकारिक स्थिति अपडेट' : 'Public issue response & status transitions',
        language === 'mr' ? 'कामाचा फोटो पुरावा जोडणे' : language === 'hi' ? 'कार्य प्रमाण अपलोड' : 'Photo proof upload & citizen verification',
        language === 'mr' ? 'मासिक सार्वजनिक कामगिरी अहवाल' : language === 'hi' ? 'मासिक सार्वजनिक रिपोर्ट' : 'Monthly transparency report publication',
        language === 'mr' ? 'कार्यालय डेटा निर्यात (CSV)' : language === 'hi' ? 'कार्यालय डेटा निर्यात (CSV)' : 'Full office data export (Always Free)',
      ],
      isFree: true,
      actionText: language === 'mr' ? 'कार्यालय नोंदणी' : language === 'hi' ? 'कार्यालय पंजीकरण' : 'Claim Office',
      actionHref: '/office/request-access',
    },
    {
      key: 'office_pro',
      name: language === 'mr' ? 'Office Pro (प्रगत)' : language === 'hi' ? 'Office Pro (उन्नत)' : 'Office Pro',
      price: billingCycle === 'yearly' ? '₹4,166' : '₹4,999',
      period: language === 'mr' ? '/महिना (वार्षिक बिल)' : language === 'hi' ? '/माह (वार्षिक बिल)' : '/month (billed yearly)',
      badge: language === 'mr' ? 'प्रभाग व महापालिका' : language === 'hi' ? 'वार्ड एवं निगम' : 'Wards & Corporations',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
      popular: true,
      description:
        language === 'mr'
          ? 'मोठ्या प्रभाग आणि महापालिकांसाठी अंतर्गत कार्यप्रवाह, कर्मचारी वाटप आणि स्वयंचलित विश्लेषण.'
          : language === 'hi'
          ? 'बड़े वार्डों और नगर निगमों के लिए आंतरिक कार्यप्रवाह, टीम असाइनमेंट और विश्लेषण।'
          : 'Internal team management, field engineer assignment, automated SLA bots, and executive analytics.',
      features: [
        language === 'mr' ? '२५ कर्मचारी जागा (Team Seats)' : language === 'hi' ? '25 टीम सीटें' : 'Up to 25 team member seats',
        language === 'mr' ? 'अभियंता कार्य वाटप (Assignment)' : language === 'hi' ? 'कार्य आवंटन' : 'Engineer & officer assignment workflow',
        language === 'mr' ? 'स्वयंचलित एसएलए सूचना बॉट्स' : language === 'hi' ? 'स्वचालित एसएलए अलर्ट' : 'Automated breach alerts & SLA reminders',
        language === 'mr' ? 'सविस्तर अंतर्गत विश्लेषण डॅशबोर्ड' : language === 'hi' ? 'विस्तृत आंतरिक विश्लेषण' : 'Advanced multi-ward analytics dashboard',
        language === 'mr' ? 'मोठ्या प्रमाणात CSV अहवाल निर्यात' : language === 'hi' ? 'थोक CSV निर्यात' : 'High-volume monthly bulk CSV exports',
      ],
      isFree: false,
      actionText: language === 'mr' ? 'Office Pro निवडा' : language === 'hi' ? 'Office Pro चुनें' : 'Get Office Pro',
      actionHref: '/office-portal',
    },
    {
      key: 'agency',
      name: language === 'mr' ? 'एजन्सी भागीदार' : language === 'hi' ? 'एजेंसी पार्टनर' : 'Agency Partner',
      price: billingCycle === 'yearly' ? '₹2,499' : '₹2,999',
      period: language === 'mr' ? '/महिना' : language === 'hi' ? '/माह' : '/month',
      badge: language === 'mr' ? 'कंत्राटदार' : language === 'hi' ? 'ठेकेदार' : 'Contractors',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description:
        language === 'mr'
          ? 'रस्ते व स्वच्छता कंत्राटदारांसाठी वर्क ऑर्डर डॅशबोर्ड आणि पुरावा व्यवस्थापन.'
          : language === 'hi'
          ? 'ठेकेदारों के लिए कार्य आदेश डैशबोर्ड और कार्य प्रमाण प्रबंधन।'
          : 'Work order dispatch, proof-of-work uploads, and assigned issue tracking for agency partners.',
      features: [
        language === 'mr' ? '१५ कंत्राटदार कर्मचारी जागा' : language === 'hi' ? '15 टीम सीटें' : '15 agency staff seats',
        language === 'mr' ? 'वर्क ऑर्डर वाटप व ट्रॅकिंग' : language === 'hi' ? 'कार्य आदेश ट्रैकिंग' : 'Work order status management',
        language === 'mr' ? 'कामाचा फोटो पुरावा बॅच अपलोड' : language === 'hi' ? 'बैच प्रमाण अपलोड' : 'Batch resolution evidence upload tools',
      ],
      isFree: false,
      actionText: language === 'mr' ? 'एजन्सी योजना' : language === 'hi' ? 'एजेंसी योजना' : 'Select Agency',
      actionHref: '/office-portal',
    },
    {
      key: 'institution',
      name: language === 'mr' ? 'संशोधन व संस्था' : language === 'hi' ? 'शोध व संस्थान' : 'Institution & Research',
      price: billingCycle === 'yearly' ? '₹8,333' : '₹9,999',
      period: language === 'mr' ? '/महिना' : language === 'hi' ? '/माह' : '/month',
      badge: language === 'mr' ? 'एनजीओ / मीडिया' : language === 'hi' ? 'एनजीओ / मीडिया' : 'NGOs / Academia',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description:
        language === 'mr'
          ? 'संशोधक, स्वयंसेवी संस्था आणि पत्रकारांसाठी निनावी डेटा आणि नागरी कल विश्लेषण.'
          : language === 'hi'
          ? 'शोधकर्ताओं और मीडिया के लिए गुमनाम नागरिक डेटा और रुझान विश्लेषण।'
          : 'Anonymized macro civic trend access, policy research datasets, and high-frequency API.',
      features: [
        language === 'mr' ? 'निनावी नागरी डेटा संच' : language === 'hi' ? 'गुमनाम नागरिक डेटा' : 'Anonymized civic data access (DPDP compliant)',
        language === 'mr' ? 'शहर व विभागवार नागरी कल अहवाल' : language === 'hi' ? 'शहरी रुझान रिपोर्ट' : 'Urban hotspot and category trend reports',
        language === 'mr' ? 'सुरक्षित एपीआय (API) प्रवेश' : language === 'hi' ? 'सुरक्षित एपीआई' : 'Dedicated research API access key',
      ],
      isFree: false,
      actionText: language === 'mr' ? 'संस्था प्रवेश' : language === 'hi' ? 'संस्थान योजना' : 'Get Access',
      actionHref: '/office-portal',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* Neutrality Pillar Guarantee */}
        <div className="bg-emerald-900 text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-2">
                {t('pricingTitle') || 'Plans & Financial Neutrality'}
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                {t('pricingSubtitle') ||
                  'Reporting, raising, and tracking issues are 100% free forever for all citizens. Money never alters issue rankings, public scorecards, or civic outcomes.'}
              </p>
              <div className="flex flex-wrap gap-3 mt-4 text-xs font-medium text-emerald-200">
                <span className="flex items-center gap-1 bg-emerald-800/80 px-2.5 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> No ads or tracking
                </span>
                <span className="flex items-center gap-1 bg-emerald-800/80 px-2.5 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> No paid ranking or boosting
                </span>
                <span className="flex items-center gap-1 bg-emerald-800/80 px-2.5 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Identical public scorecards
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Interval Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200 p-1 rounded-xl flex items-center text-sm font-medium">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly (Save ~17%)
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                Save
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl border bg-white p-6 flex flex-col justify-between transition-shadow hover:shadow-md ${
                plan.popular ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border ${plan.badgeColor}`}
                  >
                    {plan.badge}
                  </span>
                  {plan.popular && (
                    <span className="bg-indigo-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Most Popular
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
                <p className="text-xs text-slate-500 mb-4 min-h-[32px]">{plan.description}</p>

                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-xs text-slate-500">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {language === 'mr' ? 'वैशिष्ट्ये' : language === 'hi' ? 'सुविधाएं' : 'Included Capabilities'}
                  </p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Link
                  href={plan.actionHref}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : plan.isFree
                      ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.actionText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Non-Negotiable Safeguards Guarantee Section */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-600" />
            Statutory Public Commitments & Safeguards
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl">
              <strong className="block text-slate-800 mb-1">1. Citizens Never Pay</strong>
              Reporting, supporting, tracking, commenting, and citizen dashboards are free forever with zero paywalls.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <strong className="block text-slate-800 mb-1">2. Zero Outcome Tampering</strong>
              Paid subscriptions never alter issue rankings, SLA clocks, or official scorecards. Public output is identical.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <strong className="block text-slate-800 mb-1">3. Safe Lapse & Data Ownership</strong>
              If a subscription lapses, past responses and scorecards remain unchanged, and the office can always export its own data.
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <strong className="block text-slate-800 mb-1">4. Zero Advertising or Data Brokering</strong>
              No ads, no tracking pixels, and personal citizen contact details are never exposed or sold.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
