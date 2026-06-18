import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any;
  private initialized = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.init();
  }

  private init() {
    const host = this.config.get('SMTP_HOST');
    const port = this.config.get('SMTP_PORT');
    const user = this.config.get('SMTP_USER');
    const pass = this.config.get('SMTP_PASS');
    const from = this.config.get('SMTP_FROM');

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP not configured — email sending disabled');
      return;
    }

    try {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.initialized = true;
      this.logger.log('Email service initialized');
    } catch {
      this.logger.warn('nodemailer not available — email sending disabled');
    }
  }

  async sendNotification(
    recipientId: string,
    payload: { subject: string; text: string; html?: string },
  ) {
    if (!this.initialized || !this.transporter) return;

    const user = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, emailNotifications: true },
    });

    if (!user || !user.email || user.emailNotifications === false) return;

    const from = this.config.get('SMTP_FROM') ?? 'notifications@logos.app';

    try {
      await this.transporter.sendMail({
        from,
        to: user.email,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${user.email}: ${err.message}`);
    }
  }
}
