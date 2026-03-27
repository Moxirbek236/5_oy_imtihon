import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMentorProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  about?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  job?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  experience: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  telegram?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  linkedin?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  github?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  website?: string;
}

export class UpdateMentorProfileDto extends PartialType(CreateMentorProfileDto) {}
