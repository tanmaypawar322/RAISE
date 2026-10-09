export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  language?: 'en' | 'mr' | 'hi';
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  name: string;
  send(params: SendEmailParams): Promise<SendEmailResult>;
}
