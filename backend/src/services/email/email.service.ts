import { EmailProvider, SendEmailResult } from './email.interface.js';
import { ConsoleEmailProvider } from './console.provider.js';
import { SmtpEmailProvider } from './smtp.provider.js';
import { config } from '../../config/env.js';

export class EmailService {
  private static provider: EmailProvider = new ConsoleEmailProvider();

  static init(): void {
    if (config.emailProvider === 'smtp') {
      this.provider = new SmtpEmailProvider({
        host: config.smtpHost,
        port: config.smtpPort,
        user: config.smtpUser,
        pass: config.smtpPass,
        from: config.emailFrom,
      });
    } else {
      this.provider = new ConsoleEmailProvider();
    }
  }

  static getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Sends transactional password reset email with secure one-time link.
   * Never contains the user's password. Available in en/mr/hi.
   */
  static async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    language: 'en' | 'mr' | 'hi' = 'en'
  ): Promise<SendEmailResult> {
    const baseUrl = config.publicBaseUrl || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    const subjects: Record<string, string> = {
      en: 'Reset your RAISE password',
      mr: 'आपला RAISE पासवर्ड रीसेट करा',
      hi: 'अपना RAISE पासवर्ड रीसेट करें',
    };

    const bodies: Record<string, string> = {
      en: `Hello,\n\nYou recently requested to reset your password for your RAISE account. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in ${config.passwordResetTtlMinutes} minutes. If you did not request this password reset, please ignore this email and your password will remain unchanged.\n\n— The RAISE Team`,
      mr: `नमस्कार,\n\nआपण आपल्या RAISE खात्याचा पासवर्ड रीसेट करण्याची विनंती केली आहे. नवीन पासवर्ड सेट करण्यासाठी खालील लिंकवर क्लिक करा:\n\n${resetUrl}\n\nही लिंक ${config.passwordResetTtlMinutes} मिनिटांत कालबाह्य होईल. जर आपण ही विनंती केली नसेल, तर या ईमेलकडे दुर्लक्ष करा.\n\n— RAISE टीम`,
      hi: `नमस्ते,\n\nआपने अपने RAISE खाते का पासवर्ड रीसेट करने का अनुरोध किया है। नया पासवर्ड सेट करने के लिए नीचे दिए गए लिंक पर क्लिक करें:\n\n${resetUrl}\n\nयह लिंक ${config.passwordResetTtlMinutes} मिनट में समाप्त हो जाएगा। यदि आपने यह अनुरोध नहीं किया है, तो इस ईमेल को अनदेखा करें।\n\n— RAISE टीम`,
    };

    return this.provider.send({
      to: toEmail,
      subject: subjects[language] || subjects.en,
      text: bodies[language] || bodies.en,
      language,
    });
  }

  /**
   * Sends transactional password changed confirmation email.
   */
  static async sendPasswordChangedEmail(
    toEmail: string,
    language: 'en' | 'mr' | 'hi' = 'en'
  ): Promise<SendEmailResult> {
    const subjects: Record<string, string> = {
      en: 'Your RAISE password has been updated',
      mr: 'आपला RAISE पासवर्ड बदलण्यात आला आहे',
      hi: 'आपका RAISE पासवर्ड बदल दिया गया है',
    };

    const bodies: Record<string, string> = {
      en: `Hello,\n\nThis is a confirmation that your RAISE password was just changed. If you performed this action, no further steps are needed.\n\nIf you did NOT change your password, please contact our grievance officer immediately to secure your account.\n\n— The RAISE Team`,
      mr: `नमस्कार,\n\nआपल्या RAISE खात्याचा पासवर्ड नुकताच बदलण्यात आला आहे. जर आपण हा बदल केला असल्यास पुढील कोणत्याही कृतीची आवश्यकता नाही.\n\nजर आपण हा बदल केला नसेल, तर आपले खाते सुरक्षित करण्यासाठी तातडीने तक्रार निवारण अधिकाऱ्याशी संपर्क साधा.\n\n— RAISE टीम`,
      hi: `नमस्ते,\n\nयह पुष्टि है कि आपका RAISE पासवर्ड अभी बदल दिया गया है। यदि आपने यह कार्रवाई की है, तो किसी अन्य कदम की आवश्यकता नहीं है।\n\nयदि आपने अपना पासवर्ड नहीं बदला है, तो अपने खाते को सुरक्षित करने के लिए तुरंत संपर्क करें।\n\n— RAISE टीम`,
    };

    return this.provider.send({
      to: toEmail,
      subject: subjects[language] || subjects.en,
      text: bodies[language] || bodies.en,
      language,
    });
  }

  /**
   * Sends transactional notification email (only to verified emails).
   */
  static async sendNotificationEmail(
    toEmail: string,
    subject: string,
    body: string,
    language: 'en' | 'mr' | 'hi' = 'en'
  ): Promise<SendEmailResult> {
    return this.provider.send({
      to: toEmail,
      subject,
      text: body,
      language,
    });
  }

  /**
   * Sends transactional email with optional HTML and text body.
   */
  static async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<SendEmailResult> {
    return this.provider.send({
      to: params.to,
      subject: params.subject,
      text: params.text || params.subject,
      html: params.html,
      language: 'en',
    });
  }
}

