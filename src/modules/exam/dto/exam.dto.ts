import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ExamAnswer } from '@prisma/client';
import { IsString, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamDto {
  @ApiProperty({ example: "NestJS nima?" })
  @IsString()
  question: string;

  @ApiProperty({ example: 'Framework' })
  @IsString()
  variantA: string;

  @ApiProperty({ example: 'Library' })
  @IsString()
  variantB: string;

  @ApiProperty({ example: 'Database' })
  @IsString()
  variantC: string;

  @ApiProperty({ example: 'Language' })
  @IsString()
  variantD: string;

  @ApiProperty({ enum: ['variantA', 'variantB', 'variantC', 'variantD', 'variantV'] })
  @IsEnum(['variantA', 'variantB', 'variantC', 'variantD', 'variantV'])
  answer: ExamAnswer;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  sectionLessonId: number;
}

export class UpdateExamDto extends PartialType(CreateExamDto) {}

export class SubmitExamDto {
  @ApiProperty({ example: 1, description: 'Exam (savol) IDsi' })
  @IsInt()
  @Type(() => Number)
  examId: number;

  @ApiProperty({ enum: ['variantA', 'variantB', 'variantC', 'variantD', 'variantV'] })
  @IsEnum(['variantA', 'variantB', 'variantC', 'variantD', 'variantV'])
  answer: ExamAnswer;

  @ApiProperty({ example: 1, description: 'Section ID' })
  @IsInt()
  @Type(() => Number)
  sectionLessonId: number;
}
