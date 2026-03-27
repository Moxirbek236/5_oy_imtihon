import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, ParseEnumPipe, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole, PaidVia } from '@prisma/client';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'banner', maxCount: 1 },
        { name: 'introVideo', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        about: { type: 'string' },
        price: { type: 'number' },
        banner: { type: 'string', format: 'binary' },
        introVideo: { type: 'string', format: 'binary' },
        level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
        categoryId: { type: 'number' },
        published: { type: 'boolean' },
      },
    },
  })
  create(
    @Body() dto: any,
    @CurrentUser() user: any,
    @UploadedFiles() files: { banner?: Express.Multer.File[]; introVideo?: Express.Multer.File[] },
  ) {
    if (files?.banner?.[0]) dto.banner = `/uploads/${files.banner[0].filename}`;
    if (files?.introVideo?.[0]) dto.introVideo = `/uploads/${files.introVideo[0].filename}`;

    const finalDto = {
      ...dto,
      price: dto.price ? Number(dto.price) : undefined,
      categoryId: dto.categoryId ? Number(dto.categoryId) : undefined,
      published: dto.published === 'true' || dto.published === true,
    };
    return this.courseService.create(finalDto, user);
  }

  @Get()
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findAll(@Query() query: any) {
    return this.courseService.findAll(query);
  }

  @Get('mentor/me-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mentor ozining kurslarini korishi' })
  findMe(@CurrentUser() user: any, @Query() query: any) {
    return this.courseService.findMe(user, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.courseService.findOne(id, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'banner', maxCount: 1 },
        { name: 'introVideo', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        about: { type: 'string' },
        price: { type: 'number' },
        banner: { type: 'string', format: 'binary' },
        introVideo: { type: 'string', format: 'binary' },
        level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
        categoryId: { type: 'number' },
        published: { type: 'boolean' },
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
    @UploadedFiles() files: { banner?: Express.Multer.File[]; introVideo?: Express.Multer.File[] },
  ) {
    if (files?.banner?.[0]) dto.banner = `/uploads/${files.banner[0].filename}`;
    if (files?.introVideo?.[0]) dto.introVideo = `/uploads/${files.introVideo[0].filename}`;

    const finalDto = {
      ...dto,
      price: dto.price ? Number(dto.price) : undefined,
      categoryId: dto.categoryId ? Number(dto.categoryId) : undefined,
      published: dto.published === 'true' || dto.published === true,
    };
    return this.courseService.update(id, finalDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.courseService.remove(id, user);
  }

  @Post(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MENTOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}` })
  @ApiBody({ schema: { type: 'object', properties: { studentId: { type: 'integer' } } } })
  assignStudent(
    @Param('id', ParseIntPipe) id: number,
    @Body('studentId', ParseIntPipe) studentId: number,
    @CurrentUser() user: any,
  ) {
    return this.courseService.assignStudentToCourse(id, studentId, user);
  }

  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.STUDENT}` })
  @ApiBody({ schema: { type: 'object', properties: { paidVia: { type: 'string', enum: Object.values(PaidVia) } } } })
  purchaseCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body('paidVia', new ParseEnumPipe(PaidVia)) paidVia: PaidVia,
    @CurrentUser() user: any,
  ) {
    return this.courseService.purchaseCourse(id, paidVia, user);
  }
}
