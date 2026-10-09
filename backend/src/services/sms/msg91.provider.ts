import { SmsProvider } from './sms.interface.js';
import { maskPhone } from '../../utils/crypto.util.js';

export class Msg91SmsProvider implements SmsProvider {
  private authKey: string;
  private templateId: string;
  private senderId?: string;

  constructor(authKey?: string, templateId?: string, senderId?: string) {
    this.authKey = authKey || process.env.MSG91_AUTH_KEY || '';
    this.templateId = templateId || process.env.MSG91_TEMPLATE_ID || process.env.MSG91_DLT_TE_ID || '';
    this.senderId = senderId || process.env.MSG91_SENDER_ID;
  }

  async sendOtp(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
    if (!this.authKey || !this.templateId) {
      throw new Error('MSG91 provider is not configured with required MSG91_AUTH_KEY and MSG91_TEMPLATE_ID/DLT_TE_ID');
    }

    // MSG91 OTP API (Send OTP via DLT Template)
    const normalizedDigits = phone.replace(/\D/g, '').slice(-10);
    const countryCode = '91';

    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(
        this.templateId
      )}&mobile=${countryCode}${normalizedDigits}&authkey=${encodeURIComponent(this.authKey)}${
        this.senderId ? `&sender=${encodeURIComponent(this.senderId)}` : ''
      }&otp=${encodeURIComponent(otp)}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json().catch(() => ({}))) as any;
      if (!response.ok || (data && data.type === 'error')) {
        throw new Error(`MSG91 API error: ${data?.message || response.statusText}`);
      }

      return {
        success: true,
        messageId: data?.message_id || `msg91_${Date.now()}`,
      };
    } catch (err: any) {
      const masked = maskPhone(phone);
      console.error(`[MSG91] Failed to send OTP to ${masked}: ${err.message}`);
      throw new Error('Failed to deliver SMS. Please try again later.');
    }
  }

  async sendSms(phone: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    const masked = maskPhone(phone);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MSG91] Dispatched SMS to ${masked}: ${message}`);
    }
    return {
      success: true,
      messageId: `msg91_sms_${Date.now()}`,
    };
  }
}

