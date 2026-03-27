import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { LastActivityService } from './last-activity.service';
import { UpsertLastActivityDto } from './dto/last-activity.dto';

@ApiTags('Last activity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('last-activity')
export class LastActivityController {
  constructor(private readonly lastActivityService: LastActivityService) {}

  @Get('me')
  @ApiOperation({
    summary: `${UserRole.ADMIN}, ${UserRole.MENTOR}, ${UserRole.ASSISTANT}, ${UserRole.STUDENT}`,
  })
  getMine(@CurrentUser() user: any) {
    return this.lastActivityService.getMine(user.id);
  }
}
