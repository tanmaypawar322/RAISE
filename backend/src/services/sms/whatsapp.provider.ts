import { SmsProvider } from './sms.interface.js';
import { maskPhone } from '../../utils/crypto.util.js';

/**
 * TODO: WhatsApp OTP Provider (Meta WhatsApp Business Cloud API / Gupshup / Karix)
 * 
 * To implement:
 * 1. Configure META_WHATSAPP_PHONE_NUMBER_ID and META_WHATSAPP_ACCESS_TOKEN.
 * 2. Pre-approve Authentication template in WhatsApp Business Manager (OTP template with copy code button).
 * 3. Send template message to normalized phone number via:
 *    POST https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
 */
export class WhatsAppOtpProvider implements SmsProvider {
  async sendOtp(phone: string, _otp: string): Promise<{ success: boolean; messageId?: string }> {
    const masked = maskPhone(phone);
    // Placeholder implementation until WhatsApp Business API credentials and approved template are provisioned
    throw new Error(`WhatsApp OTP provider is not yet activated for destination ${masked}. Please use standard SMS.`);
  }
}
