'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldCheck,
  Scale,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  ChevronLeft,
  BookOpen,
} from 'lucide-react';

export default function MethodologyPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{language === 'mr' ? 'मुख्य पानावर परत' : language === 'hi' ? 'मुख्य पृष्ठ पर वापस' : 'Back to Grievances'}</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs mb-8">
          <div className="flex items-center gap-3 text-blue-600 mb-3">
            <Scale className="w-8 h-8" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
              {language === 'mr' ? 'पारदर्शक शासन मानक' : language === 'hi' ? 'पारदर्शी शासन मानक' : 'Platform Standards & Fairness'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
            {language === 'mr'
              ? 'RAISE कामगिरी व लोकप्रतिनिधी मूल्यांकन पद्धती'
              : language === 'hi'
              ? 'RAISE प्रदर्शन एवं जनप्रतिनिधि मूल्यांकन पद्धति'
              : 'RAISE Performance & Representative Credit Methodology'}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            {language === 'mr'
              ? 'RAISE हे नागरिकांच्या तक्रारींचे निवारण करणारे स्वतंत्र व निष्पक्ष व्यासपीठ आहे. येथे कोणत्याही पक्षाचा प्रचार, प्रायोजित स्थान किंवा अपमानाच्या क्रमवारीला स्थान नाही. सर्व लोकप्रतिनिधी व प्रशासकीय कार्यालये एकाच पारदर्शक नियमाने मोजली जातात.'
              : language === 'hi'
              ? 'RAISE नागरिकों की शिकायतों के समाधान का स्वतंत्र एवं निष्पक्ष मंच है। यहां किसी भी पार्टी का प्रचार, प्रायोजित रैंकिंग या नकारात्मक प्रचार की अनुमति नहीं है। सभी जनप्रतिनिधि और कार्यालय निष्पक्ष मानकों पर मूल्यांकित होते हैं।'
              : 'RAISE is an independent civic platform for public accountability in India. All elected representatives and government offices are evaluated under identical, transparent, published rules with strict neutrality safeguards.'}
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="space-y-6">
          {/* Rule 1: Zero Party Branding & Equal Format */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {language === 'mr'
                    ? '१. कठोर निष्पक्षता आणि पक्षातीत मांडणी'
                    : language === 'hi'
                    ? '1. पूर्ण निष्पक्षता और गैर-पक्षपाती प्रस्तुति'
                    : '1. Strict Neutrality & Zero Party Branding'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'mr'
                    ? 'कोणत्याही लोकप्रतिनिधी किंवा कार्यालयाकडून राजकीय पक्षाचे नाव, चिन्ह, रंग किंवा राष्ट्रीय ध्वज/चिन्हाचा वापर केला जात नाही. कोणतेही पेड बूस्टिंग किंवा जाहिराती दिल्या जात नाहीत. सर्व सार्वजनिक पदांना समान मोफत प्रोफाइल दिले जाते.'
                    : language === 'hi'
                    ? 'किसी भी प्रतिनिधि या कार्यालय से पार्टी का नाम, प्रतीक, रंग अथवा राष्ट्रीय ध्वज उपयोग नहीं किया जाता। पेड बूस्टिंग या प्रचार पूर्णतः वर्जित है। सभी पदों को एकसमान निशुल्क प्रोफाइल मिलता है।'
                    : 'Party affiliations, party symbols, party colors, flags, and paid boosting are strictly excluded from RAISE. Every representative and office gets the exact same profile format, metrics, and tools.'}
                </p>
              </div>
            </div>
          </div>

          {/* Rule 2: Credit from Verified Outcomes Only */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {language === 'mr'
                    ? '२. अधिकृत श्रेय फक्त नागरिक-प्रमाणित कामावर'
                    : language === 'hi'
                    ? '2. सार्वजनिक श्रेय केवल नागरिक-सत्यापित समाधान पर'
                    : '2. Credit Awarded Exclusively on Citizen-Confirmed Outcomes'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'mr'
                    ? 'लोकप्रतिनिधींच्या अधिकृत कामगिरीत फक्त नागरिकांनी मान्य केलेल्या निवारणांचा समावेश होतो. लोकप्रतिनिधींनी स्वतः लिहिलेली माहिती "स्वयं-नोंदणीकृत" (Self-Reported) म्हणून दर्शवली जाते आणि त्यावर नागरिक आक्षेप नोंदवू शकतात. ही माहिती अधिकृत गुणांमध्ये मोजली जात नाही.'
                    : language === 'hi'
                    ? 'जनप्रतिनिधियों का आधिकारिक स्कोर केवल उन मुद्दों से बनता है जिनका समाधान नागरिकों ने सत्यापित किया हो। प्रतिनिधि द्वारा स्वयं लिखे गए अपडेट्स "स्व-प्रतिवेदित" लेबल के साथ प्रकाशित होते हैं और स्कोर में नहीं गिने जाते।'
                    : 'Public credit figures are computed strictly from citizen-confirmed results of issues taken up. Self-reported updates are pre-moderated, explicitly labeled "Self-reported", open to citizen verification/disputes, and never counted in credit scores.'}
                </p>
              </div>
            </div>
          </div>

          {/* Rule 3: 72-Hour Response SLA */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {language === 'mr'
                    ? '३. ७२ तास लोकप्रतिनिधी प्रतिसाद कालमर्यादा (SLA)'
                    : language === 'hi'
                    ? '3. 72 घंटे जनप्रतिनिधि प्रतिक्रिया समय-सीमा (SLA)'
                    : '3. 72-Hour Representative Response SLA'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'mr'
                    ? 'जेव्हा मतदार "लोकप्रतिनिधींना लक्ष घालण्याची विनंती" करतात, तेव्हा प्रतिनिधी कार्यालयाला ७२ तासांचे प्रतिसाद घड्याळ दिले जाते. या मुदतीत समस्या हाती घेणे, विभागाशी पत्रव्यवहार करणे किंवा कारणासह उत्तर देणे अपेक्षित असते.'
                    : language === 'hi'
                    ? 'जब नागरिक "संज्ञान लेने का अनुरोध" करते हैं, तो प्रतिनिधि कार्यालय के लिए 72 घंटे का SLA प्रारंभ होता है। इसमें मुद्दे को उठाना या विभाग को पूछताछ टिप्पणी भेजना शामिल है।'
                    : 'When citizens submit an ask, the representative’s office has 72 hours to respond (acknowledged, taken up, or answered with reason). Citizens are limited to 5 asks per day to prevent abuse.'}
                </p>
              </div>
            </div>
          </div>

          {/* Rule 4: Minimum Sample Size of 10 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 text-slate-600 rounded-xl shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {language === 'mr'
                    ? '४. किमान नमुना मर्यादा (१० तक्रारी/विनंत्या)'
                    : language === 'hi'
                    ? '4. न्यूनतम सैंपल साइज (10 शिकायतें/अनुरोध)'
                    : '4. Minimum Sample Size Safeguard (MIN_SAMPLE = 10)'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'mr'
                    ? 'अपूर्ण माहितीच्या आधारे चुकीचे निष्कर्ष टाळण्यासाठी, ज्या कार्यालयाकडे किंवा प्रतिनिधीकडे १० पेक्षा कमी तक्रारी आहेत, त्यांची टक्केवारी दाखवली जात नाही. त्याऐवजी "नमुना खूप लहान आहे (N/१०)" असा शेरा दिसतो.'
                    : language === 'hi'
                    ? 'अपूर्ण आंकड़ों के आधार पर पक्षपात रोकने के लिए, 10 से कम मुद्दों वाले प्रोफाइल पर प्रतिशत या अंक नहीं दिखाए जाते, बल्कि केवल संख्या दर्ज की जाती है।'
                    : 'To avoid misleading statistical percentages, any office or representative with fewer than 10 total cases displays "Sample too small (N/10) to compute fair scores" instead of percentages.'}
                </p>
              </div>
            </div>
          </div>

          {/* Rule 5: Wrong Routing Exclusion within 48h */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {language === 'mr'
                    ? '५. चुकीच्या विभागास गेलेल्या तक्रारींवरून दंड नाही'
                    : language === 'hi'
                    ? '5. गलत कार्यालय को प्रेषित शिकायतों की छूट'
                    : '5. Rerouted Issues Exclusion (48h Window)'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'mr'
                    ? 'नागरिकाने चुकून दुसऱ्या विभागाकडे तक्रार दाखल केल्यास आणि ती ४८ तासांत योग्य विभागाकडे वर्ग झाल्यास, ती मूळ कार्यालयाच्या कामगिरीविरुद्ध मोजली जात नाही.'
                    : language === 'hi'
                    ? 'यदि कोई शिकायत गलत कार्यालय को दर्ज हुई और 48 घंटों में सही विभाग को पुनः सौंप दी गई, तो वह मूल कार्यालय के विरुद्ध नहीं गिनी जाती।'
                    : 'Grievances erroneously routed to the wrong office and rerouted within 48 hours are strictly excluded from the original office’s received count and SLA breach tally.'}
                </p>
              </div>
            </div>
          </div>

          {/* Rule 6: 5-Day Right of Reply & Correction Requests */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {language === 'mr'
                    ? '६. ५ दिवसांचा खुलासा हक्क आणि दुरुस्ती अर्ज'
                    : language === 'hi'
                    ? '6. 5 दिनों का पक्ष रखने का अधिकार एवं सुधार अनुरोध'
                    : '6. 5-Day Right of Reply & Correction Requests'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'mr'
                    ? 'मासिक अहवाल सार्वजनिक होण्यापूर्वी लोकप्रतिनिधी व कार्यालयांना ५ दिवसांचा मसुदा पुनरावलोकन व खुलासा नोंदवण्याचा हक्क मिळतो. याशिवाय प्रत्येक प्रोफाइलवर कोणतीही त्रुटी दुरुस्त करण्यासाठी "दुरुस्ती अर्ज" (Correction Request) सुविधा उपलब्ध आहे.'
                    : language === 'hi'
                    ? 'मासिक रिपोर्ट प्रकाशित होने से पूर्व 5 दिनों की ड्राफ्ट समीक्षा अवधि दी जाती है। किसी भी त्रुटि के समाधान के लिए प्रोफाइल पर "सुधार अनुरोध" उपलब्ध है।'
                    : 'Before monthly governance reports publish, offices have a mandatory 5-day draft review window to submit an official statement. Furthermore, any citizen or official can submit a formal Correction Request on any metric.'}
                </p>
              </div>
            </div>
          </div>

          {/* Rule 7: Zero Shame Leaderboards */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-800 rounded-xl shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {language === 'mr'
                    ? '७. अपमानास्पद क्रमवारीवर (Shame Leaderboards) बंदी'
                    : language === 'hi'
                    ? '7. किसी भी नकारात्मक रैंकिंग या शर्मिंदगी सूची पर प्रतिबंध'
                    : '7. Zero "Best / Worst" Shame Leaderboards'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'mr'
                    ? 'RAISE कधीही "सर्वोत्कृष्ट" किंवा "सर्वात वाईट" अशा याद्या प्रसिद्ध करत नाही. सर्व तुलनात्मक सारण्या अकारविल्हे (Alphabetical) किंवा भौगोलिक क्रमाने असतात.'
                    : language === 'hi'
                    ? 'RAISE कभी भी "सर्वश्रेष्ठ / निकृष्ट" जैसी सूचियां प्रकाशित नहीं करता। सभी सूचियां वर्णमाला या भौगोलिक क्रम में निष्पक्ष रूप से प्रदर्शित होती हैं।'
                    : 'The platform never publishes "best / worst" leaderboards or shame ranks (#1 or #50). All governance tables default to neutral alphabetical or geographic ordering.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Audit Notice */}
        <div className="mt-8 p-6 rounded-2xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500">
          <p>
            {language === 'mr'
              ? 'हे नियम RAISE प्लॅटफॉर्मच्या तांत्रिक संहितेत स्वयंचलितरीत्या लागू करण्यात आले आहेत. संपर्क: governance@raise.org'
              : language === 'hi'
              ? 'ये नियम RAISE के तकनीकी सिस्टम में स्वचालित रूप से लागू हैं। संपर्क: governance@raise.org'
              : 'These methodology rules are codified into RAISE algorithms and immutable audit logs. Contact: governance@raise.org'}
          </p>
        </div>
      </main>
    </div>
  );
}
