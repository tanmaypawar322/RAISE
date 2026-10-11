/**
 * RAISE Marketing Claims Registry
 *
 * NON-NEGOTIABLE RULE:
 * Every factual statement, certification, registration, partnership, or numerical metric
 * that requires official verification MUST be registered here with `verified: false`.
 *
 * Unverified claims are NEVER rendered to the public unless explicitly verified by the project lead.
 */

export type Language = 'en' | 'mr' | 'hi';

export interface ClaimEntry {
  id: string;
  category: 'legal' | 'organization' | 'funding' | 'pilot' | 'partnership' | 'metrics';
  description: string;
  text: Record<Language, string>;
  verified: boolean;
  notes: string;
}

export const claims: Record<string, ClaimEntry> = {
  section8_registration: {
    id: 'section8_registration',
    category: 'legal',
    description: 'Incorporation as a Section 8 non-profit company under the Companies Act',
    text: {
      en: 'Operated under Section 8 of the Companies Act as a non-profit public interest initiative.',
      mr: 'कंपनी कायद्याच्या कलम ८ अंतर्गत ना-नफा तत्त्वावर चालणारा सार्वजनिक हिताचा उपक्रम.',
      hi: 'कंपनी अधिनियम की धारा 8 के तहत गैर-लाभकारी सार्वजनिक हित पहल के रूप में संचालित.',
    },
    verified: false,
    notes: 'Pending confirmation of Certificate of Incorporation under Section 8.',
  },

  independent_nonprofit_status: {
    id: 'independent_nonprofit_status',
    category: 'organization',
    description: '100% Independent non-profit platform status',
    text: {
      en: '100% Non-profit and independent civic platform.',
      mr: '१००% ना-नफा आणि स्वतंत्र नागरी व्यासपीठ.',
      hi: '100% गैर-लाभकारी और स्वतंत्र नागरिक मंच.',
    },
    verified: false,
    notes: 'Requires confirmation of formal non-profit registration filing.',
  },

  funding_model_no_party_funds: {
    id: 'funding_model_no_party_funds',
    category: 'funding',
    description: 'Zero funding from political parties or partisan entities',
    text: {
      en: 'Strictly zero funding from political parties, candidates, or politically affiliated entities.',
      mr: 'कोणत्याही राजकीय पक्षाकडून, उमेदवाराकडून किंवा राजकीय संस्थांकडून शून्य निधी.',
      hi: 'किसी भी राजनीतिक दल, उम्मीदवार या राजनीतिक संस्थाओं से शून्य वित्तपोषण.',
    },
    verified: false,
    notes: 'Requires formal publication of audited funding sources.',
  },

  dpdp_compliance: {
    id: 'dpdp_compliance',
    category: 'legal',
    description: 'Statutory DPDP Act 2023 compliance certification',
    text: {
      en: 'Formally compliant with the Digital Personal Data Protection (DPDP) Act, 2023.',
      mr: 'डिजिटल वैयक्तिक डेटा संरक्षण (DPDP) कायदा २०२३ नुसार अधिकृतपणे सुसंगत.',
      hi: 'डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 के अनुसार औपचारिक रूप से अनुपालन.',
    },
    verified: false,
    notes: 'Requires statutory legal audit confirming DPDP Act 2023 compliance.',
  },

  pilot_pcmc_ward12: {
    id: 'pilot_pcmc_ward12',
    category: 'pilot',
    description: 'Active municipal pilot in Pimpri-Chinchwad Ward 12',
    text: {
      en: 'Live civic pilot active across Pimpri-Chinchwad Municipal Corporation (PCMC) Ward 12.',
      mr: 'पिंपरी-चिंचवड महानगरपालिका (PCMC) प्रभाग १२ मध्ये थेट पायलट प्रकल्प सुरू.',
      hi: 'पिंपरी-चिंचवड़ नगर निगम (PCMC) वार्ड 12 में लाइव पायलट प्रोजेक्ट सक्रिय.',
    },
    verified: false,
    notes: 'Requires formal municipal agreement or public launch milestone confirmation.',
  },

  partner_agencies: {
    id: 'partner_agencies',
    category: 'partnership',
    description: 'Formal partnership with municipal corporations or utility bodies',
    text: {
      en: 'Formally integrated with local municipal and utility departments.',
      mr: 'स्थानिक महानगरपालिका आणि उपयुक्तता विभागांशी औपचारिकरित्या जोडलेले.',
      hi: 'स्थानीय नगर निगम और उपयोगिता विभागों के साथ औपचारिक रूप से एकीकृत.',
    },
    verified: false,
    notes: 'Requires signed MoUs with designated public agencies.',
  },

  user_counts_and_metrics: {
    id: 'user_counts_and_metrics',
    category: 'metrics',
    description: 'Specific active user or resolved issue statistics',
    text: {
      en: 'Thousands of verified community issues resolved in record time.',
      mr: 'हजारो नागरिकांच्या तक्रारींचे वेळेत निवारण.',
      hi: 'हजारों नागरिक शिकायतों का समय पर निवारण.',
    },
    verified: false,
    notes: 'Requires production telemetry audit before stating metrics.',
  },
};
