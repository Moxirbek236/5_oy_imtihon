import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisService } from 'src/common/redis.service';
import { MailService } from 'src/common/mail.service';

@Module({
  providers: [AuthService, RedisService, MailService],
  controllers: [AuthController],
})
export class AuthModule {}
