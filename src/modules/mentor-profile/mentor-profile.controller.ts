import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, } from '@nestjs/swagger';
import { MentorProfileService } from './mentor-profile.service';
import { CreateMentorProfileDto, UpdateMentorProfileDto } from './dto/mentor-profile.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Mentor Profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller('mentor-profiles')
export class MentorProfileController {
  constructor(private readonly mentorProfileService: MentorProfileService) {}

  @Post()
  @Roles(UserRole.MENTOR)
  @ApiOperation({ summary: `${UserRole.MENTOR}` })
  create(@Body() dto: CreateMentorProfileDto, @CurrentUser() user: any) {
    return this.mentorProfileService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findAll(@Query() query: PaginationDto) {
    return this.mentorProfileService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mentorProfileService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMentorProfileDto,
    @CurrentUser() user: any,
  ) {
    return this.mentorProfileService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({ summary: `${UserRole.MENTOR}, ${UserRole.ADMIN}` })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.mentorProfileService.remove(id, user);
  }
}
