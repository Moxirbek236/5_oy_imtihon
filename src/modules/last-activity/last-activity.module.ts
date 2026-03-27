import { Module } from '@nestjs/common';
import { LastActivityController } from './last-activity.controller';
import { LastActivityService } from './last-activity.service';

@Module({
  controllers: [LastActivityController],
  providers: [LastActivityService],
  exports: [LastActivityService],
})
export class LastActivityModule {}
