import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, ParseArrayPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ExamService } from './exam.service';
import { CreateExamDto, UpdateExamDto, SubmitExamDto } from './dto/exam.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  create(@Body() dto: CreateExamDto, @CurrentUser() user: any) {
    return this.examService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.examService.findAll(query, user);
  }

  @Post('submit')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: `${UserRole.STUDENT}` })
  @ApiBody({ type: [SubmitExamDto] })
  submit(@Body(new ParseArrayPipe({ items: SubmitExamDto })) dtos: SubmitExamDto[], @CurrentUser() user: any) {
    return this.examService.submitMany(dtos, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.examService.findOne(id, user);
  }

  @Put(':id')
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamDto,
    @CurrentUser() user: any,
  ) {
    return this.examService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.examService.remove(id, user);
  }
}
