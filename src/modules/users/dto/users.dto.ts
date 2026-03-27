import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsEnum, IsOptional, MinLength, IsEmail } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'test@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, example: '+998901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Ali Valiyev' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  image?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  email?: string;
  phone?: string;
  fullName?: string;
  password?: string;
  role?: UserRole;
  image?: string;
}

import { OmitType } from '@nestjs/swagger';

export class UpdateMeDto extends OmitType(UpdateUserDto, ['role']) {}
