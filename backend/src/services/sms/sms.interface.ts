export interface SmsProvider {
  sendOtp(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }>;
  sendSms?(phone: string, message: string): Promise<{ success: boolean; messageId?: string }>;
}

