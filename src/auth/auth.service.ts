import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/common/redis.service';
import { MailService } from 'src/common/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  async sendOtp(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Bu email bilan foydalanuvchi mavjud');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await this.redisService.saveOTP(email, otp);
    const sent = await this.mailService.sendOTP(email, otp);

    if (!sent) throw new BadRequestException('Elektron pochtaga yuborishda xatolik yuz berdi');

    return { success: true, message: 'OTP xabar pochtangizga yuborildi', otp };
  }

  async register(email: string, fullName: string, password: string, otp: string) {
    const savedOtp = await this.redisService.getOTP(email);
    if (!savedOtp || savedOtp !== otp) {
      throw new UnauthorizedException("OTP kod notogri yoki muddati tugagan");
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException("Bu email allaqachon royxatdan otgan");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        password: hashedPassword,
        role: 'STUDENT',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    await this.redisService.deleteOTP(email);

    const payload = { id: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return { success: true, data: { access_token, user } };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Bunday elektron pochta bilan foydalanuvchi topilmadi');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException("Parol notogri");

    const payload = { id: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      success: true,
      data: {
        access_token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          image: user.image,
        },
      },
    };
  }

  async getMe(currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, email: true, phone: true, fullName: true, role: true, image: true, createdAt: true, mentorProfile: true },
    });
    return { success: true, data: user };
  }

  async sendOtpForForgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.saveOTP(email, otp);
    await this.mailService.sendOTP(email, otp);

    return { success: true, message: 'OTP xabar pochtangizga yuborildi', otp };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const savedOtp = await this.redisService.getOTP(email);
    if (!savedOtp || savedOtp !== otp) {
      throw new UnauthorizedException("OTP kod notogri yoki muddati tugagan");
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await this.redisService.deleteOTP(email);
    return { success: true, message: 'Parol muvaffaqiyatli yangilandi' };
  }
}
