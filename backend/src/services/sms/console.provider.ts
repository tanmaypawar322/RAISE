import { SmsProvider } from './sms.interface.js';
import { maskPhone } from '../../utils/crypto.util.js';

export class ConsoleSmsProvider implements SmsProvider {
  async sendOtp(phone: string, _otp: string): Promise<{ success: boolean; messageId?: string }> {
    const masked = maskPhone(phone);
    if (process.env.NODE_ENV !== 'production') {
      // Diagnostic log in dev only - NEVER logging plaintext OTP or full phone
      console.log(`[SMS-DEV-PROVIDER] Dispatched verification code to ${masked}`);
    }
    return {
      success: true,
      messageId: `console_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  async sendSms(phone: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    const masked = maskPhone(phone);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS-DEV-PROVIDER] Dispatched SMS notification to ${masked}: ${message}`);
    }
    return {
      success: true,
      messageId: `console_sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }
}

