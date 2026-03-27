import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { LastActivityModule } from '../last-activity/last-activity.module';

@Module({
  imports: [LastActivityModule],
  controllers: [LessonController],
  providers: [LessonService],
})
export class LessonModule {}
