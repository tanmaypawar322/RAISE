import { EmailProvider, SendEmailParams, SendEmailResult } from './email.interface.js';
import { recordDevEmail } from './dev-mailbox.js';

export class ConsoleEmailProvider implements EmailProvider {
  name = 'console';

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      console.warn(
        '[EMAIL-SECURITY-WARNING] Console email provider is active in production. Email links are suppressed for security.'
      );
      return {
        success: false,
        error: 'Password reset email delivery is temporarily unavailable in production when using the console provider.',
      };
    }

    // In development/test mode, record in dev mailbox and output to terminal
    recordDevEmail({
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    console.log('\n================== [DEV EMAIL DISPATCH] ==================');
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log('Body:');
    console.log(params.text);
    console.log('==========================================================\n');

    return { success: true, messageId: `console_${Date.now()}` };
  }
}
