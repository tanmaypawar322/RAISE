import { NotificationType } from '../models/Notification.js';

export interface TemplateVariables {
  issueTitle?: string;
  ward?: string;
  officeName?: string;
  linkUrl?: string;
  status?: string;
  hours?: number;
  reason?: string;
  outcome?: string;
}

interface LocalizedTemplate {
  title: string;
  body: string;
  smsText?: string;
}

export type SupportedLanguage = 'en' | 'mr' | 'hi';

const TEMPLATES: Record<
  NotificationType,
  Record<SupportedLanguage, (vars: TemplateVariables) => LocalizedTemplate>
> = {
  issue_published: {
    en: (v) => ({
      title: 'Grievance Published',
      body: `Your grievance "${v.issueTitle || 'Issue'}" has been published and assigned to ${v.officeName || 'the local authority'}.`,
    }),
    mr: (v) => ({
      title: 'तक्रार प्रसिद्ध झाली',
      body: `तुमची तक्रार "${v.issueTitle || 'तक्रार'}" प्रसिद्ध झाली असून ती ${v.officeName || 'स्थानिक कार्यालयाकडे'} सोपवली आहे.`,
    }),
    hi: (v) => ({
      title: 'शिकायत प्रकाशित हुई',
      body: `आपकी शिकायत "${v.issueTitle || 'शिकायत'}" प्रकाशित हो गई है और ${v.officeName || 'संबंधित कार्यालय'} को सौंपी गई है।`,
    }),
  },
  issue_acknowledged: {
    en: (v) => ({
      title: 'Grievance Acknowledged',
      body: `${v.officeName || 'The responsible office'} has formally acknowledged "${v.issueTitle || 'Issue'}". Statutory SLA clock is active.`,
      smsText: `RAISE: Grievance acknowledged by ${v.officeName || 'office'}. Track: ${v.linkUrl || 'https://raise.org'}`,
    }),
    mr: (v) => ({
      title: 'तक्रारीची दखल घेतली',
      body: `${v.officeName || 'संबंधित कार्यालयाने'} "${v.issueTitle || 'तक्रार'}" ची औपचारिक दखल घेतली आहे. SLA घड्याळ सुरू झाले आहे.`,
      smsText: `RAISE: तक्रारीची कार्यालयाने दखल घेतली आहे. पहा: ${v.linkUrl || 'https://raise.org'}`,
    }),
    hi: (v) => ({
      title: 'शिकायत पर संज्ञान लिया गया',
      body: `${v.officeName || 'संबंधित कार्यालय'} ने "${v.issueTitle || 'शिकायत'}" पर औपचारिक संज्ञान लिया है। SLA घड़ी सक्रिय है।`,
      smsText: `RAISE: शिकायत पर संज्ञान लिया गया। स्थिति देखें: ${v.linkUrl || 'https://raise.org'}`,
    }),
  },
  issue_status_updated: {
    en: (v) => ({
      title: 'Status Update',
      body: `Update on "${v.issueTitle || 'Issue'}": Status updated to ${v.status || 'in progress'}.`,
    }),
    mr: (v) => ({
      title: 'कामकाज स्थिती अद्यतन',
      body: `"${v.issueTitle || 'तक्रार'}": स्थिती ${v.status || 'प्रगतीपथावर'} अशी अद्यतनित झाली आहे.`,
    }),
    hi: (v) => ({
      title: 'स्थिति अपडेट',
      body: `"${v.issueTitle || 'शिकायत'}": स्थिति बदलकर ${v.status || 'प्रगति पर'} हो गई है।`,
    }),
  },
  issue_resolved_pending_confirmation: {
    en: (v) => ({
      title: 'Work Completed - Confirmation Required',
      body: `${v.officeName || 'The department'} marked "${v.issueTitle || 'Issue'}" as resolved. Please inspect and confirm or dispute within 7 days.`,
      smsText: `RAISE: Work marked resolved by ${v.officeName || 'office'}. Please confirm or dispute: ${v.linkUrl || 'https://raise.org'}`,
    }),
    mr: (v) => ({
      title: 'काम पूर्ण झाल्याची नोंद - पडताळणी आवश्यक',
      body: `${v.officeName || 'कार्यालयाने'} "${v.issueTitle || 'तक्रार'}" चे निवारण केले आहे. कृपया ७ दिवसांत कामाची पाहणी करून मान्यता द्या किंवा आक्षेप नोंदवा.`,
      smsText: `RAISE: काम पूर्ण झाल्याची नोंद केली आहे. कृपया ७ दिवसांत खात्री करा किंवा आक्षेप घ्या: ${v.linkUrl || 'https://raise.org'}`,
    }),
    hi: (v) => ({
      title: 'कार्य पूर्ण चिह्नित - पुष्टि आवश्यक',
      body: `${v.officeName || 'कार्यालय'} ने "${v.issueTitle || 'शिकायत'}" का समाधान चिह्नित किया है। कृपया 7 दिनों में पुष्टि करें या आपत्ति दर्ज करें।`,
      smsText: `RAISE: कार्य पूर्ण चिह्नित किया गया। कृपया 7 दिनों में पुष्टि या आपत्ति दर्ज करें: ${v.linkUrl || 'https://raise.org'}`,
    }),
  },
  issue_disputed: {
    en: (v) => ({
      title: 'Grievance Disputed & Reopened',
      body: `A resident disputed the resolution of "${v.issueTitle || 'Issue'}". The issue is reopened and the SLA clock restarted.`,
      smsText: `RAISE: Resolution disputed by resident. Issue reopened. Track: ${v.linkUrl || 'https://raise.org'}`,
    }),
    mr: (v) => ({
      title: 'निवारणावर आक्षेप - तक्रार पुन्हा उघडली',
      body: `नागरिकाने "${v.issueTitle || 'तक्रार'}" च्या निवारणावर आक्षेप घेतला आहे. तक्रार पुन्हा सुरू झाली असून SLA घड्याळ पुन्हा सुरू झाले आहे.`,
      smsText: `RAISE: निवारणावर आक्षेप नोंदवला. तक्रार पुन्हा सुरू झाली. पहा: ${v.linkUrl || 'https://raise.org'}`,
    }),
    hi: (v) => ({
      title: 'समाधान पर आपत्ति - शिकायत पुनः खुली',
      body: `नागरिक ने "${v.issueTitle || 'शिकायत'}" के समाधान पर आपत्ति दर्ज की। शिकायत पुनः खुल गई और SLA पुनः प्रारंभ हुआ।`,
      smsText: `RAISE: समाधान पर आपत्ति दर्ज। शिकायत पुनः खुली। स्थिति: ${v.linkUrl || 'https://raise.org'}`,
    }),
  },
  issue_escalated: {
    en: (v) => ({
      title: 'Statutory SLA Escalation',
      body: `"${v.issueTitle || 'Issue'}" passed its SLA window with no acknowledgement and has been escalated to ${v.officeName || 'senior authority'}.`,
    }),
    mr: (v) => ({
      title: 'कायदेशीर मुदत संपली - तक्रार वर्ग',
      body: `"${v.issueTitle || 'तक्रार'}" ची कालमर्यादा संपल्यामुळे ती वरिष्ठ ${v.officeName || 'कार्यालयाकडे'} वर्ग करण्यात आली आहे.`,
    }),
    hi: (v) => ({
      title: 'वैधानिक SLA उल्लंघन - शिकायत प्रेषित',
      body: `"${v.issueTitle || 'शिकायत'}" की समय सीमा समाप्त होने के कारण इसे वरिष्ठ ${v.officeName || 'कार्यालय'} को प्रेषित किया गया है।`,
    }),
  },
  issue_merged: {
    en: (v) => ({
      title: 'Grievance Merged as Duplicate',
      body: `Your grievance "${v.issueTitle || 'Issue'}" was merged into a canonical issue to amplify collective citizen pressure.`,
    }),
    mr: (v) => ({
      title: 'तक्रार मुख्य तक्रारीत विलीन केली',
      body: `नागरिकांचा सामूहिक प्रभाव वाढवण्यासाठी तुमची तक्रार "${v.issueTitle || 'तक्रार'}" मुख्य तक्रारीत विलीन करण्यात आली आहे.`,
    }),
    hi: (v) => ({
      title: 'शिकायत मुख्य शिकायत में विलीन',
      body: `सामूहिक प्रभाव बढ़ाने के लिए आपकी शिकायत "${v.issueTitle || 'शिकायत'}" को मुख्य शिकायत में विलीन कर दिया गया है।`,
    }),
  },
  supported_issue_updated: {
    en: (v) => ({
      title: 'Supported Grievance Updated',
      body: `A grievance you supported ("${v.issueTitle || 'Issue'}") has been updated to ${v.status || 'in progress'}.`,
    }),
    mr: (v) => ({
      title: 'तुम्ही पाठिंबा दिलेल्या तक्रारीत प्रगती',
      body: `तुम्ही पाठिंबा दिलेल्या "${v.issueTitle || 'तक्रार'}" ची स्थिती ${v.status || 'प्रगतीपथावर'} अशी बदलली आहे.`,
    }),
    hi: (v) => ({
      title: 'समर्थित शिकायत में अपडेट',
      body: `आपके द्वारा समर्थित शिकायत "${v.issueTitle || 'शिकायत'}" की स्थिति ${v.status || 'प्रगति पर'} में बदल गई है।`,
    }),
  },
  moderation_outcome: {
    en: (v) => ({
      title: 'Moderation Review Outcome',
      body: `Review completed for "${v.issueTitle || 'your submission'}": ${v.reason || 'Content reviewed by platform moderation'}.`,
    }),
    mr: (v) => ({
      title: 'मॉडरेशन आढावा निकाल',
      body: `"${v.issueTitle || 'तुमच्या नोंदीचा'}" आढावा पूर्ण झाला: ${v.reason || 'सामग्रीची तपासणी पूर्ण झाली'}.`,
    }),
    hi: (v) => ({
      title: 'मॉडरेशन समीक्षा परिणाम',
      body: `"${v.issueTitle || 'आपकी प्रस्तुति'}" की समीक्षा पूर्ण: ${v.reason || 'सामग्री की जांच पूरी हुई'}।`,
    }),
  },
  office_new_assignment: {
    en: (v) => ({
      title: 'New Grievance Assigned',
      body: `New civic grievance filed in ${v.ward || 'your ward'}: "${v.issueTitle || 'Issue'}". Statutory SLA clock active.`,
    }),
    mr: (v) => ({
      title: 'नवीन तक्रार सोपवली',
      body: `${v.ward || 'तुमच्या कार्यक्षेत्रातील'} नवीन तक्रार: "${v.issueTitle || 'तक्रार'}". SLA कालमर्यादा घड्याळ सुरू झाले आहे.`,
    }),
    hi: (v) => ({
      title: 'नई शिकायत सौंपी गई',
      body: `${v.ward || 'आपके क्षेत्र'} में नया मुद्दा: "${v.issueTitle || 'शिकायत'}". SLA घड़ी सक्रिय है।`,
    }),
  },
  office_sla_warning_75: {
    en: (v) => ({
      title: 'SLA Warning: 75% Time Elapsed',
      body: `Warning: "${v.issueTitle || 'Issue'}" has reached 75% of its SLA deadline. Immediate departmental action required.`,
    }),
    mr: (v) => ({
      title: 'SLA इशारा: ७५% वेळ संपली',
      body: `इशारा: "${v.issueTitle || 'तक्रार'}" ची ७५% कालमर्यादा उलटली आहे. तातडीने कार्यालयीन कारवाई आवश्यक.`,
    }),
    hi: (v) => ({
      title: 'SLA चेतावनी: 75% समय समाप्त',
      body: `चेतावनी: "${v.issueTitle || 'शिकायत'}" की 75% समय सीमा समाप्त हो चुकी है। तत्काल विभागीय कार्रवाई आवश्यक।`,
    }),
  },
  office_sla_breached: {
    en: (v) => ({
      title: 'Statutory SLA Deadline Breached',
      body: `Urgent: SLA deadline breached for "${v.issueTitle || 'Issue'}". Automated escalation ladder initiated.`,
    }),
    mr: (v) => ({
      title: 'SLA कालमर्यादा समाप्त (उल्लंघन)',
      body: `तातडीचे: "${v.issueTitle || 'तक्रार'}" ची SLA मुदत संपली आहे. स्वयंचलित एस्केलेशन सुरू करण्यात आले आहे.`,
    }),
    hi: (v) => ({
      title: 'SLA समय सीमा समाप्त (उल्लंघन)',
      body: `अति आवश्यक: "${v.issueTitle || 'शिकायत'}" की समय सीमा समाप्त हो गई है। स्वचालित एस्केलेशन प्रारंभ किया गया।`,
    }),
  },
  office_escalation_received: {
    en: (v) => ({
      title: 'Escalated Grievance Received',
      body: `"${v.issueTitle || 'Issue'}" has been escalated to your office from subordinate office due to SLA breach.`,
    }),
    mr: (v) => ({
      title: 'वरिष्ठ कार्यालयाकडे तक्रार वर्ग',
      body: `मुदत संपल्यामुळे दुय्यम कार्यालयाकडून "${v.issueTitle || 'तक्रार'}" ही तक्रार तुमच्या कार्यालयाकडे वर्ग झाली आहे.`,
    }),
    hi: (v) => ({
      title: 'एस्केलेटेड शिकायत प्राप्त हुई',
      body: `समय सीमा समाप्त होने के कारण अधीनस्थ कार्यालय से "${v.issueTitle || 'शिकायत'}" आपके कार्यालय को प्राप्त हुई है।`,
    }),
  },
};

export class NotificationTemplates {
  static render(
    type: NotificationType,
    lang: SupportedLanguage = 'en',
    vars: TemplateVariables = {}
  ): LocalizedTemplate {
    const langKey: SupportedLanguage = ['en', 'mr', 'hi'].includes(lang) ? lang : 'en';
    const generator = TEMPLATES[type]?.[langKey] || TEMPLATES[type]?.['en'];

    if (!generator) {
      return {
        title: 'RAISE Notification',
        body: vars.issueTitle || 'Civic update received.',
      };
    }

    return generator(vars);
  }
}
