import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestionDto {
  @ApiProperty({ example: 'Prisma nima?' })
  @IsString()
  text: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  file?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  courseId: number;
}

export class UpdateQuestionDto extends PartialType(CreateQuestionDto) {}

export class CreateQuestionAnswerDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  questionId: number;

  @ApiProperty({ example: 'Prisma - ORM vositasidir' })
  @IsString()
  text: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  file?: string;
}
