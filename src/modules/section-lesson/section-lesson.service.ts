import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSectionLessonDto, UpdateSectionLessonDto } from './dto/section-lesson.dto';
import { assertMentorOrAdminOwnsCourse, assertStudentCanAccessCourse } from 'src/common/assert-course-access';
import { LastActivityService } from '../last-activity/last-activity.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class SectionLessonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lastActivityService: LastActivityService,
  ) {}

  async create(dto: CreateSectionLessonDto, user: any) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    await assertMentorOrAdminOwnsCourse(this.prisma, user, dto.courseId);
    const section = await this.prisma.sectionLesson.create({
      data: dto,
      include: { course: { select: { id: true, name: true } } },
    });
    return { success: true, data: section };
  }

  async findAll(query: any = {}, user: any) {
    const where: any = {};

    if (query.courseId) {
      const cid = parseInt(query.courseId);
      await assertStudentCanAccessCourse(this.prisma, user, cid);
      where.courseId = cid;
    } else if (user.role === UserRole.STUDENT) {
      // Agar student courseId bermasa, u barcha bo'limlarni ko'ra olmaydi
      // Faqat o'zi sotib olgan kurs bo'limlarini filter qilish mumkin, 
      // lekin odatda bitta kurs bo'yicha so'raladi.
      where.course = {
        OR: [
          { purchasedCourses: { some: { userId: user.id } } },
          { assignedCourses: { some: { userId: user.id } } },
        ],
      };
    }

    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    if (user.role === UserRole.MENTOR && !query.courseId) {
      where.course = { mentorId: user.id };
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [sections, total] = await this.prisma.$transaction([
      this.prisma.sectionLesson.findMany({
        where,
        include: {
          course: { select: { id: true, name: true } },
          lessons: { select: { id: true, name: true, createdAt: true } },
          _count: { select: { exams: true, lessons: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.sectionLesson.count({ where }),
    ]);

    return { success: true, data: sections, total, page, limit };
  }

  async findOne(id: number, user: any) {
    const section = await this.prisma.sectionLesson.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, mentorId: true } },
        lessons: { include: { lessonFiles: true, homework: true } },
        exams: true,
        _count: { select: { exams: true, lessons: true } },
      },
    });
    if (!section) throw new NotFoundException('Bolim topilmadi');

    await assertStudentCanAccessCourse(this.prisma, user, section.courseId);

    if (user && user.role === UserRole.STUDENT) {
      await this.lastActivityService.upsert(user.id, { sectionId: id });
    }

    return { success: true, data: section };
  }

  async update(id: number, dto: UpdateSectionLessonDto, user: any) {
    const section = await this.prisma.sectionLesson.findUnique({ where: { id } });
    if (!section) throw new NotFoundException('Bolim topilmadi');
    await assertMentorOrAdminOwnsCourse(this.prisma, user, section.courseId);

    if (dto.courseId && dto.courseId !== section.courseId) {
      const newCourse = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
      if (!newCourse) throw new BadRequestException('Yangi kurs topilmadi');
      await assertMentorOrAdminOwnsCourse(this.prisma, user, dto.courseId);
    }

    const updated = await this.prisma.sectionLesson.update({
      where: { id },
      data: dto,
      include: { course: { select: { id: true, name: true } } },
    });
    return { success: true, data: updated };
  }

  async remove(id: number, user: any) {
    const section = await this.prisma.sectionLesson.findUnique({ where: { id } });
    if (!section) throw new NotFoundException('Bolim topilmadi');
    await assertMentorOrAdminOwnsCourse(this.prisma, user, section.courseId);
    await this.prisma.sectionLesson.delete({ where: { id } });
    return { success: true, message: "Bolim ochirildi" };
  }
}
