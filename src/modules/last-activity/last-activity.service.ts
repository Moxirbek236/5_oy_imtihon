import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpsertLastActivityDto } from './dto/last-activity.dto';

@Injectable()
export class LastActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: number) {
    const row = await this.prisma.lastActivity.findUnique({
      where: { userId },
      include: {
        course: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        lesson: { select: { id: true, name: true } },
      },
    });
    return { success: true, data: row };
  }

  async upsert(userId: number, dto: UpsertLastActivityDto) {
    let finalCourseId = dto.courseId;
    let finalSectionId = dto.sectionId;
    let finalLessonId = dto.lessonId;

    if (finalLessonId) {
      const l = await this.prisma.lesson.findUnique({
        where: { id: finalLessonId },
        include: { section: true },
      });
      if (!l) throw new NotFoundException('Dars topilmadi');
      finalSectionId = l.sectionId;
      finalCourseId = l.section.courseId;
    } else if (finalSectionId != null) {
      const s = await this.prisma.sectionLesson.findUnique({ where: { id: finalSectionId } });
      if (!s) throw new NotFoundException('Bolim topilmadi');
      finalCourseId = s.courseId;
    } else if (finalCourseId) {
      const c = await this.prisma.course.findUnique({ where: { id: finalCourseId } });
      if (!c) throw new NotFoundException('Kurs topilmadi');
    }

    let generatedUrl = dto.url || null;

    if (!generatedUrl) {
      if (finalLessonId) {
        generatedUrl = `/lessons/${finalLessonId}`;
      } else if (finalSectionId) {
        generatedUrl = `/section-lessons/${finalSectionId}`;
      } else if (finalCourseId) {
        generatedUrl = `/courses/${finalCourseId}`;
      }
    }

    const data = {
      courseId: finalCourseId ?? null,
      sectionId: finalSectionId ?? null,
      lessonId: finalLessonId ?? null,
      url: generatedUrl,
    };

    const row = await this.prisma.lastActivity.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      include: {
        course: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        lesson: { select: { id: true, name: true } },
      },
    });

    return { success: true, data: row };
  }
}
