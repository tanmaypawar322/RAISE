'use client';

import React from 'react';
import Link from 'next/link';
import { Mail, Clock, MapPin, ArrowLeft, Shield, Building, PhoneCall } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function GrievanceRedressalPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-orange-600 transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'mr' ? '← मुख्य पृष्ठावर जा' : language === 'hi' ? '← मुख्य पृष्ठ पर जाएं' : '← Back to Home'}</span>
        </Link>

        {language === 'mr' ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                माहिती तंत्रज्ञान नियम २०२१ व DPDP कायदा सुसंगत
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              वैधानिक तक्रार निवारण अधिकारी
            </h1>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              माहिती तंत्रज्ञान (मध्यस्थ मार्गदर्शक तत्त्वे आणि डिजिटल मीडिया आचारसंहिता) नियम २०२१ आणि डिजिटल वैयक्तिक डेटा संरक्षण कायदा २०२३ अंतर्गत प्रकटन.
            </p>

            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h2 className="font-bold text-orange-950 flex items-center gap-2 mb-3 text-base">
                  <Shield className="w-5 h-5 text-orange-600" />
                  नामित तक्रार निवारण अधिकारी तपशील
                </h2>
                <div className="space-y-2 text-xs text-orange-900">
                  <p><strong>नाव:</strong> अ‍ॅड. राधिका देशमुख (नामित तक्रार निवारण व डेटा संरक्षण अधिकारी)</p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-orange-700" />
                    <strong>ईमेल:</strong> <a href="mailto:grievance@raise.org" className="underline font-bold">grievance@raise.org</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-700" />
                    <strong>पत्ता:</strong> RAISE तक्रार निवारण कक्ष, पिंपरी-चिंचवड, पुणे - ४११०४४, महाराष्ट्र.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">कायदेशीर प्रतिसाद कालमर्यादा</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold block mb-1">पोचपावती कालावधी</span>
                    <span className="text-sm font-extrabold text-gray-900">२४ तासांच्या आत</span>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold block mb-1">निवारण कालावधी</span>
                    <span className="text-sm font-extrabold text-gray-900">१५ दिवसांच्या आत</span>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">तक्रार नोंदवण्याची पद्धत</h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  आपल्या खात्याशी, गोपनीयतेशी किंवा सामग्रीशी संबंधित कोणताही आक्षेप असल्यास आपण थेट वरील ईमेलवर तक्रार नोंदवू शकता. तक्रारीत समस्येचा आयडी (Issue ID) आणि स्पष्ट कारण नमूद करावे.
                </p>
              </section>
            </div>
          </div>
        ) : language === 'hi' ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                IT नियम 2021 एवं DPDP अधिनियम अनुपालन
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              वैधानिक शिकायत निवारण अधिकारी
            </h1>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              सूचना प्रौद्योगिकी (मध्यवर्ती दिशानिर्देश) नियम 2021 तथा डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के अंतर्गत सार्वजनिक घोषणा।
            </p>

            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h2 className="font-bold text-orange-950 flex items-center gap-2 mb-3 text-base">
                  <Shield className="w-5 h-5 text-orange-600" />
                  नामित शिकायत निवारण अधिकारी
                </h2>
                <div className="space-y-2 text-xs text-orange-900">
                  <p><strong>नाम:</strong> एडवोकेट राधिका देशमुख (नामित शिकायत एवं डेटा संरक्षण अधिकारी)</p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-orange-700" />
                    <strong>ईमेल:</strong> <a href="mailto:grievance@raise.org" className="underline font-bold">grievance@raise.org</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-700" />
                    <strong>पता:</strong> RAISE शिकायत निवारण प्रकोष्ठ, पिंपरी-चिंचवड, पुणे - 411044, महाराष्ट्र।
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">वैधानिक समय सीमा</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold block mb-1">पावती समय</span>
                    <span className="text-sm font-extrabold text-gray-900">24 घंटे के भीतर</span>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold block mb-1">निवारण समय सीमा</span>
                    <span className="text-sm font-extrabold text-gray-900">15 दिनों के भीतर</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                Statutory Redressal Mechanism
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              Designated Grievance Redressal Officer
            </h1>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              Mandatory disclosure under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021 and the Digital Personal Data Protection Act 2023.
            </p>

            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h2 className="font-bold text-orange-950 flex items-center gap-2 mb-3 text-base">
                  <Shield className="w-5 h-5 text-orange-600" />
                  Officer Details
                </h2>
                <div className="space-y-2 text-xs text-orange-900">
                  <p><strong>Name:</strong> Adv. Radhika Deshmukh (Designated Grievance & DPDP Officer)</p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-orange-700" />
                    <strong>Official Redressal Email:</strong> <a href="mailto:grievance@raise.org" className="underline font-bold">grievance@raise.org</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-700" />
                    <strong>Physical Jurisdiction Address:</strong> RAISE Grievance Cell, Pimpri-Chinchwad, Pune - 411044, Maharashtra, India.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">Statutory Resolution Timelines</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold block mb-1">Acknowledgement Window</span>
                    <span className="text-sm font-extrabold text-gray-900">Within 24 Hours</span>
                  </div>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-500 font-bold block mb-1">Full Redressal Timeline</span>
                    <span className="text-sm font-extrabold text-gray-900">Within 15 Days</span>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">How to Lodge a Statutory Complaint</h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Residents or officials may email grievance@raise.org with their registered email/phone, the Issue ID or URL, and the specific nature of their complaint (e.g. personal information leak, defamatory content, or procedural non-compliance).
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
