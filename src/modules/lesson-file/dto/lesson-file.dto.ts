import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonFileDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  lessonId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  file?: string;
}
