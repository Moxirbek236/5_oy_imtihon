import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto } from './dto/lesson.dto';
import {
  assertMentorOrAdminOwnsLesson,
  assertMentorOrAdminOwnsSection,
  assertStudentCanAccessCourse,
} from 'src/common/assert-course-access';
import { LastActivityService } from '../last-activity/last-activity.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class LessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lastActivityService: LastActivityService,
  ) {}

  async create(dto: CreateLessonDto, user: any) {
    const section = await this.prisma.sectionLesson.findUnique({ where: { id: dto.sectionId } });
    if (!section) throw new NotFoundException('Bolim topilmadi');
    await assertMentorOrAdminOwnsSection(this.prisma, user, dto.sectionId);
    const lesson = await this.prisma.lesson.create({
      data: dto,
      include: { section: { select: { id: true, name: true, courseId: true } } },
    });
    return { success: true, data: lesson };
  }

  async findOne(id: number, user: any) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        section: { select: { id: true, name: true, courseId: true } },
        lessonFiles: true,
        homework: true,
        lessonViews: { select: { userId: true, view: true } },
      },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    await assertStudentCanAccessCourse(this.prisma, user, lesson.section.courseId);

    if (user && user.role === UserRole.STUDENT) {
      await this.lastActivityService.upsert(user.id, { lessonId: id });
    }

    return { success: true, data: lesson };
  }

  async update(id: number, dto: UpdateLessonDto, user: any) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    await assertMentorOrAdminOwnsLesson(this.prisma, user, id);

    if (dto.sectionId != null) {
      const section = await this.prisma.sectionLesson.findUnique({ where: { id: dto.sectionId } });
      if (!section) throw new BadRequestException("Bolim topilmadi");
      await assertMentorOrAdminOwnsSection(this.prisma, user, dto.sectionId);
    }

    const updated = await this.prisma.lesson.update({
      where: { id },
      data: dto,
      include: { section: { select: { id: true, name: true, courseId: true } } },
    });
    return { success: true, data: updated };
  }

  async remove(id: number, user: any) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    await assertMentorOrAdminOwnsLesson(this.prisma, user, id);
    await this.prisma.lesson.delete({ where: { id } });
    return { success: true, message: "Dars ochirildi" };
  }

  async markViewed(lessonId: number, userId: number) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { select: { id: true, courseId: true } } },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    await assertStudentCanAccessCourse(this.prisma, { id: userId, role: 'STUDENT' }, lesson.section.courseId);

    const view = await this.prisma.lessonView.upsert({
      where: { lessonId_userId: { lessonId, userId } },
      create: { lessonId, userId, view: true },
      update: { view: true },
    });
    await this.prisma.lastActivity.upsert({
      where: { userId },
      create: {
        userId,
        courseId: lesson.section.courseId,
        sectionId: lesson.section.id,
        lessonId,
      },
      update: {
        courseId: lesson.section.courseId,
        sectionId: lesson.section.id,
        lessonId,
      },
    });
    return { success: true, data: view };
  }
}
