import { EmailProvider, SendEmailParams, SendEmailResult } from './email.interface.js';

export interface SmtpConfig {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}

export class SmtpEmailProvider implements EmailProvider {
  name = 'smtp';
  private config: SmtpConfig;

  constructor(config: SmtpConfig) {
    this.config = config;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (!this.config.host) {
      return {
        success: false,
        error: 'SMTP host is not configured.',
      };
    }

    // SMTP adapter skeleton: in a production container, this would use nodemailer
    // Log dispatch without printing email credentials
    console.log(`[SMTP-PROVIDER] Dispatching email to ${params.to} via ${this.config.host}:${this.config.port || 587}`);
    return {
      success: true,
      messageId: `smtp_${Date.now()}`,
    };
  }
}
