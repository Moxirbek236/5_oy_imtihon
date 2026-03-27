import { Module } from '@nestjs/common';
import { SectionLessonService } from './section-lesson.service';
import { SectionLessonController } from './section-lesson.controller';
import { LastActivityModule } from '../last-activity/last-activity.module';

@Module({
  imports: [LastActivityModule],
  controllers: [SectionLessonController],
  providers: [SectionLessonService],
})
export class SectionLessonModule {}
