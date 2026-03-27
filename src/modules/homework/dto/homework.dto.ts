import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class CreateHomeworkDto {
  @ApiProperty({ example: "Uyga vazifa: ..." })
  @IsString()
  task: string;

  @ApiProperty({ required: false, type: 'string', format: 'binary' })
  @IsString()
  @IsOptional()
  file?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  lessonId: number;
}

export class UpdateHomeworkDto extends PartialType(CreateHomeworkDto) {}

export class HomeworkQueryDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lessonId?: number;
}

export class SubmitHomeworkDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ example: 'file.pdf', type: 'string', format: 'binary' })
  @IsString()
  @IsOptional()
  file?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Type(() => Number)
  homeworkId: number;
}

export class ReviewHomeworkDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsString()
  status: 'APPROVED' | 'REJECTED';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
