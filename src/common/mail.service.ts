import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS uchun false bo'lishi kerak
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Sertifikat xatolarini o'tkazib yuborish
      },
    });
  }

  async sendOTP(email: string, otp: string) {
    const mailUser = process.env.EMAIL_USER || 'no-reply@lms.com';
    const fromHeader =
      process.env.EMAIL_FROM?.trim() || `"LMS Platform" <${mailUser}>`;
    try {
      await this.transporter.sendMail({
        from: fromHeader,
        to: email,
        subject: 'LMS Platform - OTP Tasdiqlash Kodi',
        html: `<h2>Assalomu alaykum!</h2><p>Sizning OTP kodingiz: <b>${otp}</b></p><p>Kodning amal qilish muddati 5 daqiqa.</p>`,
      });
      this.logger.log(`OTP (${otp}) muvaffaqiyatli ${email} pochtasiga yuborildi.`);
      return true;
    } catch (error) {
      this.logger.error('Email yuborishda xatolik:', error);
      return false;
    }
  }
}
