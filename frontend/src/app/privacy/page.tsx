'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, Trash2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function PrivacyPage() {
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
                DPDP कायदा २०२३ सुसंगत
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              गोपनीयता धोरण व नागरिक डेटा सुरक्षा
            </h1>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              अंतिम अद्यतन: ऑक्टोबर २०२६ • पिंपरी-चिंचवड / पुणे नागरी तक्रार निवारण पायलट
            </p>

            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h2 className="font-bold text-orange-950 flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  नागरिकांच्या गोपनीयतेची त्रिसूत्री
                </h2>
                <ul className="text-xs text-orange-900 space-y-1.5 list-disc list-inside">
                  <li><strong>गोपनीय फोन नंबर:</strong> आपला मोबाईल नंबर कोणत्याही अधिकाऱ्याला किंवा इतर नागरिकाला कधीही दाखवला जात नाही.</li>
                  <li><strong>टोपणनाव मुभा:</strong> तक्रार दाखल करताना किंवा पाठिंबा देताना टोपणनाव (Pseudonym) वापरता येते.</li>
                  <li><strong>कमीतकमी डेटा संकलन:</strong> केवळ तक्रार निवारणासाठी आवश्यक असणाराच डेटा गोळा केला जातो.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">१. गोळा करण्यात येणारी माहिती</h2>
                <p className="text-xs text-gray-600 mb-2">
                  आम्ही नागरिकांकडून केवळ तक्रारीचे निरसन करण्यासाठी खालील माहिती घेतो:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-2">
                  <li>मोबाईल क्रमांक (AES-256-GCM द्वारे एनक्रिप्ट करून साठवला जातो) किंवा ईमेल पत्ता.</li>
                  <li>तक्रारीचे स्थान (जीपीएस अक्षांश व रेखांश) आणि वॉर्ड क्रमांक.</li>
                  <li>समस्येचे फोटो किंवा ऑडिओ रेकॉर्डिंग.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">२. माहितीचा वापर</h2>
                <p className="text-xs text-gray-600">
                  गोळा केलेली माहिती केवळ संबंधित महापालिका किंवा शासकीय कार्यालयाकडे समस्या पाठवण्यासाठी आणि कायदेशीर SLA कालावधीत कामाचा पाठपुरावा करण्यासाठी वापरली जाते. कोणत्याही व्यावसायिक कारणासाठी डेटा विकला जात नाही.
                </p>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">३. नागरिकांचे अधिकार (DPDP Act 2023)</h2>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-2">
                  <li><strong>माहिती पाहण्याचा अधिकार:</strong> आपण आपल्या खात्यातील सर्व माहिती पाहू शकता.</li>
                  <li><strong>खाते हटवण्याचा अधिकार (Right to Erasure):</strong> आपण आपल्या प्रोफाइलमधून एका क्लिकवर खाते व वैयक्तिक डेटा कायमस्वरूपी नष्ट करू शकता.</li>
                  <li><strong>तक्रार निवारण अधिकारी:</strong> कोणत्याही गोपनीयता आक्षेपासाठी आपण आमच्या तक्रार निवारण अधिकाऱ्याशी संपर्क साधू शकता.</li>
                </ul>
              </section>
            </div>
          </div>
        ) : language === 'hi' ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                DPDP अधिनियम 2023 अनुपालन
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              गोपनीयता नीति एवं नागरिक डेटा सुरक्षा
            </h1>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              अंतिम अद्यतन: अक्टूबर 2026 • पिंपरी-चिंचवड / पुणे नागरिक शिकायत निवारण पायलट
            </p>

            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h2 className="font-bold text-orange-950 flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  नागरिक गोपनीयता गारंटी
                </h2>
                <ul className="text-xs text-orange-900 space-y-1.5 list-disc list-inside">
                  <li><strong>अदृश्य फोन नंबर:</strong> आपका मोबाइल नंबर किसी भी अधिकारी या नागरिक को कभी नहीं दिखाया जाता।</li>
                  <li><strong>छद्म नाम की अनुमति:</strong> समस्या दर्ज करते समय उपनाम (Pseudonym) का उपयोग करने की स्वतंत्रता।</li>
                  <li><strong>डेटा न्यूनीकरण:</strong> केवल निवारण के लिए आवश्यक डेटा ही लिया जाता है।</li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">1. एकत्र की जाने वाली जानकारी</h2>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-2">
                  <li>मोबाइल नंबर (AES-256-GCM द्वारा सुरक्षित एन्क्रिप्टेड) या ईमेल।</li>
                  <li>समस्या का भौगोलिक स्थान (GPS निर्देशांक) और वार्ड विवरण।</li>
                  <li>नागरिक द्वारा अपलोड की गई तस्वीरें या आवाज रिकॉर्डिंग।</li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">2. डेटा का उपयोग</h2>
                <p className="text-xs text-gray-600">
                  यह डेटा केवल संबंधित वार्ड कार्यालय या विभाग को समस्या प्रेषित करने तथा वैधानिक SLA समय सीमा की निगरानी के लिए उपयोग किया जाता है।
                </p>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">3. नागरिकों के अधिकार (DPDP Act)</h2>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-2">
                  <li><strong>डेटा देखने का अधिकार:</strong> अपने सभी विवरणों की समीक्षा करने का अधिकार।</li>
                  <li><strong>खाता हटाने का अधिकार (Right to Erasure):</strong> अपनी प्रोफाइल से कभी भी स्व-सेवा के माध्यम से डेटा पूर्णतः मिटाने का विकल्प।</li>
                  <li><strong>शिकायत अधिकारी से संपर्क:</strong> किसी भी डेटा सुरक्षा चिंता हेतु नामित अधिकारी उपलब्ध हैं।</li>
                </ul>
              </section>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                DPDP Act 2023 Compliant
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              Privacy Policy & Citizen Data Protection
            </h1>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              Last updated: October 2026 • Pimpri-Chinchwad / Pune Civic Grievance Pilot
            </p>

            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h2 className="font-bold text-orange-950 flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  Our Citizen Privacy Commitments
                </h2>
                <ul className="text-xs text-orange-900 space-y-1.5 list-disc list-inside">
                  <li><strong>Zero Phone Disclosure:</strong> Your mobile number is encrypted at rest using AES-256-GCM and never shared with municipal offices, contractors, or third parties.</li>
                  <li><strong>Pseudonymity Allowed:</strong> You are free to post and support civic grievances under a pseudonym.</li>
                  <li><strong>Data Minimization:</strong> We only collect what is strictly necessary to assign and resolve civic work orders.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">1. Information We Collect</h2>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-2">
                  <li>Identifier: Encrypted Indian mobile phone (+91) or email address with hash indexing.</li>
                  <li>Location data: Precise GPS coordinates and ward boundary of the reported civic issue.</li>
                  <li>Media: Photographic proof of the defect and optional voice descriptions.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">2. Purpose of Processing</h2>
                <p className="text-xs text-gray-600">
                  Data is processed exclusively for statutory civic grievance routing to municipal offices, public SLA monitoring, and community confirmation of completed public works. We do not sell data, engage in commercial profiling, or run third-party advertising trackers.
                </p>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">3. Citizen Rights Under DPDP Act 2023</h2>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside pl-2">
                  <li><strong>Right to Access:</strong> View your active grievances, supports, and notification preferences at any time.</li>
                  <li><strong>Right to Erasure:</strong> Self-serve account deletion is permanently available in your profile, instantly wiping PII and invalidating active sessions.</li>
                  <li><strong>Grievance Redressal:</strong> Direct recourse to our statutory Grievance Officer within 24 hours.</li>
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
