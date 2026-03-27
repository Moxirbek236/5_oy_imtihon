import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CourseLevel } from '@prisma/client';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({ example: 'NestJS kursi' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Bu kurs haqida...' })
  @IsString()
  about: string;

  @ApiProperty({ example: 299000 })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  banner?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  introVideo?: string;

  @ApiProperty({ enum: CourseLevel, example: CourseLevel.BEGINNER })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  categoryId: number;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  name?: string;
  description?: string;
  price?: number;
  level?: CourseLevel;
  categoryId?: number;
  banner?: string;
}
