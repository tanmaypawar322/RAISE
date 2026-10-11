'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, CheckCircle2, AlertOctagon, ArrowLeft, Users } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function TermsPage() {
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
                नागरिक सहभागिता सनद
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              नियम, अटी व व्यासपीठ सनद
            </h1>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              अंतिम अद्यतन: ऑक्टोबर २०२६ • RAISE व्यासपीठ
            </p>

            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h2 className="font-bold text-orange-950 flex items-center gap-2 mb-1.5">
                  <Scale className="w-4 h-4 text-orange-600" />
                  व्यासपीठाची निष्पक्षता हमी
                </h2>
                <p className="text-xs text-orange-900 leading-relaxed">
                  RAISE हे पूर्णपणे गैर-राजकीय आणि गैर-व्यावसायिक नागरी व्यासपीठ आहे. पैसे देऊन तक्रार वर आणणे किंवा कृत्रिम प्रसिद्धी देणे येथे पूर्णपणे अशक्य आहे. प्रत्येक तक्रारीचे प्राधान्य हे नागरिकांच्या वास्तविक पाठिंब्यावर आणि कायदेशीर मुदतीवर अवलंबून असते.
                </p>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">१. एक व्यक्ती, एक पाठिंबा (One Person, One Raise)</h2>
                <p className="text-xs text-gray-600">
                  व्यासपीठावरील विश्वासार्हता टिकवून ठेवण्यासाठी एका समस्येला एका खात्यातून एकदाच पाठिंबा देता येतो. एकाधिक बोगस खाती बनवून मतपेढी वाढवण्याचा प्रयत्न केल्यास अशी खाती तत्काळ निलंबित केली जातात.
                </p>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">२. निषिद्ध सामग्री व गैरवर्तन</h2>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-2">
                  <li><strong>द्वेषयुक्त भाषण व शिवीगाळ:</strong> कोणत्याही समाज, धर्म किंवा व्यक्तीविरुद्ध अपमानास्पद भाषा खपवून घेतली जाणार नाही.</li>
                  <li><strong>वैयक्तिक माहिती उघड करणे (Doxxing):</strong> कोणाचाही खाजगी फोन नंबर, घराचा पत्ता किंवा खाजगी दस्तऐवज प्रसिद्ध करणे सक्त मनाई आहे.</li>
                  <li><strong>खोटी माहिती:</strong> खोटी तक्रार दाखल करणे किंवा जुने/असंबंधित फोटो टाकणे प्रतिबंधित आहे.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">३. प्रशासकीय प्रतिसाद व पडताळणी</h2>
                <p className="text-xs text-gray-600">
                  कार्यालयाने काम पूर्ण केल्याची नोंद केल्यावर नागरिकांना प्रत्यक्ष जागेची पाहणी करून ७ दिवसांत मान्यता देण्याचा किंवा आक्षेप नोंदवण्याचा अधिकार आहे.
                </p>
              </section>
            </div>
          </div>
        ) : language === 'hi' ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                नागरिक सहभागिता चार्टर
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              नियम, शर्तें एवं नागरिक आचार संहिता
            </h1>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              अंतिम अद्यतन: अक्टूबर 2026 • RAISE
            </p>

            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h2 className="font-bold text-orange-950 flex items-center gap-2 mb-1.5">
                  <Scale className="w-4 h-4 text-orange-600" />
                  प्लेटफ़ॉर्म की निष्पक्षता गारंटी
                </h2>
                <p className="text-xs text-orange-900 leading-relaxed">
                  RAISE पूर्णतः गैर-राजनीतिक एवं गैर-व्यावसायिक मंच है। किसी भी मुद्दे को पैसे देकर ऊपर लाना संभव नहीं है। रैंकिंग केवल जन-समर्थन और कानूनी SLA प्राथमिकताओं पर आधारित होती है।
                </p>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">1. एक व्यक्ति, एक समर्थन (One Person, One Raise)</h2>
                <p className="text-xs text-gray-600">
                  लोकतांत्रिक संतुलन के लिए एक नागरिक एक मुद्दे को केवल एक बार समर्थन दे सकता है।
                </p>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">2. निषिद्ध गतिविधियां</h2>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-2">
                  <li>द्वेषपूर्ण टिप्पणी या गाली-गलौज सख्त वर्जित है।</li>
                  <li>किसी भी नागरिक का व्यक्तिगत फोन नंबर या पता सार्वजनिक करना प्रतिबंधित है।</li>
                  <li>गलत या झूठी तस्वीरें अपलोड करने पर खाता निलंबित किया जाएगा।</li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">3. कार्य सत्यापन व नागरिक अधिकार</h2>
                <p className="text-xs text-gray-600">
                  प्रशासन द्वारा कार्य पूर्ण दर्शाने के पश्चात 7 दिनों के भीतर नागरिकों को कार्य की पुष्टि या आपत्ति दर्ज करने का वैधानिक अधिकार है।
                </p>
              </section>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                Civic Participation Charter
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              Terms of Service & Community Guidelines
            </h1>
            <p className="text-xs text-gray-500 mb-8 font-medium leading-relaxed">
              Last updated: October 2026 • RAISE Civic Platform
            </p>

            <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
              <section className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <h2 className="font-bold text-orange-950 flex items-center gap-2 mb-1.5">
                  <Scale className="w-4 h-4 text-orange-600" />
                  Our Neutrality Commitment
                </h2>
                <p className="text-xs text-orange-900 leading-relaxed">
                  RAISE is an independent, non-partisan, non-commercial civic grievance platform. Ranking and prioritization are strictly determined by genuine community support and statutory municipal SLA windows. No commercial payments, promoted listings, or political bias influence issue visibility.
                </p>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">1. One-Person-One-Raise Rule</h2>
                <p className="text-xs text-gray-600">
                  Every resident has an equal voice. Each account is limited to one raise (support) per grievance. Coordinated botting or multi-account manipulation leads to automated suspension.
                </p>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">2. Prohibited Content</h2>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside pl-2">
                  <li><strong>Hate Speech & Harassment:</strong> Any slurs, derogatory content, or threats directed at individuals or communities are immediately removed.</li>
                  <li><strong>Doxxing & Personal Info:</strong> Publishing personal telephone numbers, private residential addresses, or vehicle details is strictly forbidden.</li>
                  <li><strong>Fabricated Grievances:</strong> Submitting fake photos, non-existent potholes, or commercial advertisements is prohibited.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-bold text-gray-900 text-base mb-2">3. Citizen Confirmation & Auditing</h2>
                <p className="text-xs text-gray-600">
                  When a responsible office marks a grievance as resolved with photo proof, residents retain a 7-day confirmation window to inspect the site and confirm work completion or dispute the resolution with reasons.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
