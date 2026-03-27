import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { CourseCategoryModule } from 'src/modules/course-category/course-category.module';
import { CourseModule } from 'src/modules/course/course.module';
import { SectionLessonModule } from 'src/modules/section-lesson/section-lesson.module';
import { LessonModule } from 'src/modules/lesson/lesson.module';
import { HomeworkModule } from 'src/modules/homework/homework.module';
import { ExamModule } from 'src/modules/exam/exam.module';
import { QuestionModule } from 'src/modules/question/question.module';
import { MentorProfileModule } from 'src/modules/mentor-profile/mentor-profile.module';
import { RatingModule } from 'src/modules/rating/rating.module';
import { LastActivityModule } from 'src/modules/last-activity/last-activity.module';
import { LessonFileModule } from 'src/modules/lesson-file/lesson-file.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'lms_secret',
      signOptions: { expiresIn: '7d' },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MentorProfileModule,
    CourseCategoryModule,
    CourseModule,
    SectionLessonModule,
    LessonModule,
    HomeworkModule,
    ExamModule,
    QuestionModule,
    RatingModule,
    LastActivityModule,
    LessonFileModule,

  ],
})
export class AppModule {}
