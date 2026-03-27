import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RatingService } from './rating.service';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Ratings')
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.STUDENT}` })
  @ApiBody({ type: CreateRatingDto })
  create(@Body() dto: CreateRatingDto, @CurrentUser() user: any) {
    return this.ratingService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findAll(@Query() query: any) {
    return this.ratingService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ratingService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.STUDENT}, ${UserRole.ADMIN}` })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRatingDto,
    @CurrentUser() user: any,
  ) {
    return this.ratingService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: `${UserRole.STUDENT}, ${UserRole.ADMIN}` })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.ratingService.remove(id, user);
  }
}
