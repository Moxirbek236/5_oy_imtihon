import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @ApiProperty({ example: '1-Dars kirish' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Bu dars haqida...' })
  @IsString()
  about: string;

  @ApiProperty({ example: 'https://video.com/lesson1' })
  @IsString()
  video: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  sectionId: number;
}

export class UpdateLessonDto extends PartialType(CreateLessonDto) {}
