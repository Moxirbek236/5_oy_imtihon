import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: 'your.email@gmail.com', description: 'Elektron pochta' })
  @IsEmail()
  email: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'your.email@gmail.com', description: 'Elektron pochta' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ali Valiyev', description: 'To\'liq ism' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'Password123', description: 'Parol' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '123456', description: 'OTP Kod' })
  @IsString()
  otp: string;
}

export class LoginDto {
  @ApiProperty({ example: 'your.email@gmail.com', description: 'Elektron pochta' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123', description: 'Parol' })
  @IsString()
  @MinLength(6)
  password: string;
}
export class ResetPasswordDto {
  @ApiProperty({ example: 'your.email@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'NewSecret123' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
