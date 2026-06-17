export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}

export interface SendMailResult {
  messageId: string;
}

/**
 * Mail sağlayıcı portu (Adapter Pattern). Bugün Google SMTP/Nodemailer ile
 * uygulanıyor; ileride başka bir sağlayıcıya geçilirse sadece bu interface'i
 * implemente eden yeni bir provider eklenir, MailService/Processor değişmez.
 */
export interface IMailProvider {
  send(options: SendMailOptions): Promise<SendMailResult>;
}

export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');
