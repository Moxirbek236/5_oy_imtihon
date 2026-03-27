import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, } from '@nestjs/swagger';
import { SectionLessonService } from './section-lesson.service';
import { CreateSectionLessonDto, UpdateSectionLessonDto } from './dto/section-lesson.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Section Lessons')
@Controller('section-lessons')
export class SectionLessonController {
  constructor(private readonly sectionLessonService: SectionLessonService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  create(@Body() dto: CreateSectionLessonDto, @CurrentUser() user: any) {
    return this.sectionLessonService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}`,
  })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.sectionLessonService.findAll(query, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}`,
  })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.sectionLessonService.findOne(id, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionLessonDto,
    @CurrentUser() user: any,
  ) {
    return this.sectionLessonService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.sectionLessonService.remove(id, user);
  }
}
