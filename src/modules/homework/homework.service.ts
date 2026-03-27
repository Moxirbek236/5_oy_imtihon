import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateHomeworkDto,
  UpdateHomeworkDto,
  SubmitHomeworkDto,
  ReviewHomeworkDto,
} from './dto/homework.dto';
import { UserRole, HomeworkSubStatus } from '@prisma/client';
import {
  assertMentorOrAdminOwnsLesson,
  assertStudentCanAccessCourse,
} from 'src/common/assert-course-access';

@Injectable()
export class HomeworkService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHomeworkDto, user: any) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');
    await assertMentorOrAdminOwnsLesson(this.prisma, user, dto.lessonId);

    const existingHw = await this.prisma.homework.findUnique({ where: { lessonId: dto.lessonId } });
    if (existingHw) throw new BadRequestException('Bu darsga allaqachon vazifa biriktirilgan');

    const homework = await this.prisma.homework.create({
      data: dto,
      include: { lesson: { select: { id: true, name: true } } },
    });
    return { success: true, data: homework };
  }

  async findAll(query: any = {}, user: any) {
    const where: any = {};

    if (query.lessonId) {
      where.lessonId = parseInt(query.lessonId);
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: where.lessonId },
        include: { section: true },
      });
      if (!lesson) throw new NotFoundException('Dars topilmadi');
      await assertStudentCanAccessCourse(this.prisma, user, lesson.section.courseId);
    } else if (user.role === 'STUDENT') {
      where.lesson = {
        section: {
          course: {
            OR: [
              { purchasedCourses: { some: { userId: user.id } } },
              { assignedCourses: { some: { userId: user.id } } },
            ],
          },
        },
      };
    } else if (user.role === 'MENTOR') {
      where.lesson = { section: { course: { mentorId: user.id } } };
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [homeworks, total] = await this.prisma.$transaction([
      this.prisma.homework.findMany({
        where,
        include: {
          lesson: {
            select: {
              id: true,
              name: true,
              section: { select: { id: true, name: true, courseId: true } },
            },
          },
          _count: { select: { submissions: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.homework.count({ where }),
    ]);

    return { success: true, data: homeworks, total, page, limit };
  }

  async findOne(id: number, user: any) {
    const hw = await this.prisma.homework.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            section: { select: { id: true, name: true, courseId: true } },
          },
        },
        submissions: user.role !== 'STUDENT'
          ? {
              include: {
                user: { select: { id: true, fullName: true, image: true } },
              },
            }
          : {
              where: { userId: user.id },
            },
      },
    });
    if (!hw) throw new NotFoundException('Vazifa topilmadi');

    await assertStudentCanAccessCourse(this.prisma, user, hw.lesson.section.courseId);

    return { success: true, data: hw };
  }

  async update(id: number, dto: UpdateHomeworkDto, user: any) {
    const hw = await this.prisma.homework.findUnique({ where: { id } });
    if (!hw) throw new NotFoundException('Vazifa topilmadi');
    await assertMentorOrAdminOwnsLesson(this.prisma, user, hw.lessonId);

    if (dto.lessonId && dto.lessonId !== hw.lessonId) {
      const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
      if (!lesson) throw new BadRequestException('Dars topilmadi');
      await assertMentorOrAdminOwnsLesson(this.prisma, user, dto.lessonId);
    }

    const updated = await this.prisma.homework.update({
      where: { id },
      data: dto,
      include: { lesson: { select: { id: true, name: true } } },
    });
    return { success: true, data: updated };
  }

  async remove(id: number, user: any) {
    const hw = await this.prisma.homework.findUnique({ where: { id } });
    if (!hw) throw new NotFoundException('Vazifa topilmadi');
    await assertMentorOrAdminOwnsLesson(this.prisma, user, hw.lessonId);
    await this.prisma.homework.delete({ where: { id } });
    return { success: true, message: "Vazifa ochirildi" };
  }

  async submit(dto: any, currentUser: any) {
    const homeworkId = Number(dto.homeworkId);
    if (!homeworkId) throw new BadRequestException('homeworkId kiritilishi shart');

    const hw = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { lesson: { include: { section: true } } },
    });
    if (!hw) throw new NotFoundException('Vazifa topilmadi');

    await assertStudentCanAccessCourse(this.prisma, currentUser, hw.lesson.section.courseId);

    const submission = await this.prisma.homeworkSubmission.create({
      data: {
        text: dto.text,
        file: dto.file || '',
        homeworkId: homeworkId,
        userId: currentUser.id,
        status: HomeworkSubStatus.PENDING,
      },
      include: {
        homework: { select: { id: true, task: true } },
        user: { select: { id: true, fullName: true, image: true } },
      },
    });
    return { success: true, data: submission };
  }

  async review(submissionId: number, dto: ReviewHomeworkDto, currentUser: any) {
    if (
      currentUser.role !== UserRole.MENTOR &&
      currentUser.role !== UserRole.ASSISTANT &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException("Vazifani baholash huquqi yoq");
    }

    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Topshirma topilmadi');

    if (submission.status !== HomeworkSubStatus.PENDING) {
      throw new BadRequestException('Bu topshirma allaqachon baholangan');
    }

    const updated = await this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        status: dto.status as HomeworkSubStatus,
        reason: dto.reason,
      },
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        homework: { select: { id: true, task: true } },
      },
    });
    return { success: true, data: updated };
  }

  async getMySubmissions(currentUser: any) {
    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: { userId: currentUser.id },
      include: {
        homework: {
          include: {
            lesson: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: submissions };
  }
}
