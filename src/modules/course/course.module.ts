import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { LastActivityModule } from '../last-activity/last-activity.module';

@Module({
  imports: [LastActivityModule],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
