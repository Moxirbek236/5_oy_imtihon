import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { QuestionService } from './question.service';
import { CreateQuestionDto, UpdateQuestionDto, CreateQuestionAnswerDto } from './dto/question.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `q-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `${UserRole.STUDENT}` })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'number' },
        text: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  create(
    @Body() dto: any,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) dto.file = `/uploads/${file.filename}`;
    const finalDto = {
      ...dto,
      courseId: dto.courseId ? Number(dto.courseId) : undefined,
    };
    return this.questionService.create(finalDto, user);
  }

  @Get()
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.questionService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.questionService.findOne(id, user);
  }

  @Post('answers')
  @Roles(UserRole.MENTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `qa-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: `${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.ADMIN}`,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        questionId: { type: 'number' },
        text: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  addAnswer(
    @Body() dto: any,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) dto.file = `/uploads/${file.filename}`;
    return this.questionService.addAnswer({ ...dto, questionId: Number(dto.questionId) }, user);
  }

  @Put(':id')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `q-upd-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `${UserRole.STUDENT}` })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        courseId: { type: 'number' },
        text: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) dto.file = `/uploads/${file.filename}`;
    const finalDto = {
      ...dto,
      courseId: dto.courseId ? Number(dto.courseId) : undefined,
    };
    return this.questionService.update(id, finalDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiOperation({ summary: `${UserRole.STUDENT}, ${UserRole.ADMIN}` })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.questionService.remove(id, user);
  }
}
