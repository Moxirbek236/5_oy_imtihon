import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService extends Redis {
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    super(process.env.REDIS_URL || 'redis://localhost:6379');
    this.on('connect', () => this.logger.log('✅ Redis ulangan!'));
    this.on('error', (err) => this.logger.error('❌ Redis xatosi:', err));
  }

  async saveOTP(email: string, otp: string, ttlSeconds = 300) {
    await this.set(`otp:${email}`, otp, 'EX', ttlSeconds);
  }

  async getOTP(email: string): Promise<string | null> {
    return this.get(`otp:${email}`);
  }

  async deleteOTP(email: string) {
    await this.del(`otp:${email}`);
  }
}
