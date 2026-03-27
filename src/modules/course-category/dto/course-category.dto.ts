import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCourseCategoryDto {
  @ApiProperty({ example: 'Backend' })
  @IsString()
  name: string;
}

export class UpdateCourseCategoryDto extends PartialType(CreateCourseCategoryDto) {}
