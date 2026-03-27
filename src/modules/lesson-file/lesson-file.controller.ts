import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { LessonFileService } from './lesson-file.service';
import { CreateLessonFileDto } from './dto/lesson-file.dto';

@ApiTags('Lesson files')
@Controller('lesson-files')
export class LessonFileController {
  constructor(private readonly lessonFileService: LessonFileService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `lf-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['lessonId', 'file'],
      properties: {
        lessonId: { type: 'number' },
        note: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  create(
    @Body() dto: any,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file?.filename) {
      throw new BadRequestException('file majburiy');
    }
    const finalDto = {
      ...dto,
      lessonId: dto.lessonId ? Number(dto.lessonId) : undefined,
    };
    return this.lessonFileService.create(finalDto, `/uploads/${file.filename}`, user);
  }

  @Get()
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  list(@Query('lessonId', ParseIntPipe) lessonId: number) {
    return this.lessonFileService.findByLesson(lessonId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.lessonFileService.remove(id, user);
  }
}
