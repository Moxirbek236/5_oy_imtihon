import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSectionLessonDto {
  @ApiProperty({ example: '1-Bo\'lim' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  courseId: number;
}

export class UpdateSectionLessonDto extends PartialType(CreateSectionLessonDto) {}
