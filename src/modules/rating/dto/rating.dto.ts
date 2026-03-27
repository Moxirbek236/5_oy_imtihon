import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRatingDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rate: number;

  @ApiProperty({ example: 'Juda yaxshi kurs!' })
  @IsString()
  comment: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  courseId: number;
}

export class UpdateRatingDto extends PartialType(CreateRatingDto) {}
