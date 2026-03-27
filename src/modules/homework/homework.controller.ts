import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { HomeworkService } from './homework.service';
import {
  CreateHomeworkDto,
  UpdateHomeworkDto,
  HomeworkQueryDto,
  SubmitHomeworkDto,
  ReviewHomeworkDto,
} from './dto/homework.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Homeworks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('homeworks')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `hw-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['task', 'lessonId'],
      properties: {
        task: { type: 'string', example: 'Homework task description' },
        lessonId: { type: 'number', example: 1 },
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
    if (file) dto.file = `/uploads/${file.filename}`;
    return this.homeworkService.create(
      { ...dto, lessonId: Number(dto.lessonId) },
      user,
    );
  }

  @Get()
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findAll(@Query() query: HomeworkQueryDto, @CurrentUser() user: any) {
    return this.homeworkService.findAll(query, user);
  }

  @Get('my-submissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: `${UserRole.STUDENT}` })
  getMySubmissions(@CurrentUser() user: any) {
    return this.homeworkService.getMySubmissions(user);
  }

  @Get(':id')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.homeworkService.findOne(id, user);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `hw-upd-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        task: { type: 'string' },
        lessonId: { type: 'number' },
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
    const updateData = { ...dto };
    if (dto.lessonId) updateData.lessonId = Number(dto.lessonId);
    return this.homeworkService.update(id, updateData, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.homeworkService.remove(id, user);
  }

  @Post('submit')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `ans-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['homeworkId', 'file'],
      properties: {
        homeworkId: { type: 'number' },
        text: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: `${UserRole.STUDENT}` })
  submit(
    @Body() dto: any,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) dto.file = `/uploads/${file.filename}`;
    return this.homeworkService.submit({ ...dto, homeworkId: Number(dto.homeworkId) }, user);
  }

  @Put('submissions/:id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ASSISTANT, UserRole.ADMIN)
  @ApiOperation({
    summary: `${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.ADMIN}`,
  })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewHomeworkDto,
    @CurrentUser() user: any,
  ) {
    return this.homeworkService.review(id, dto, user);
  }
}
