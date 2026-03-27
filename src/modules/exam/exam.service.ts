import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExamResult } from '@prisma/client';
import { CreateExamDto, UpdateExamDto, SubmitExamDto } from './dto/exam.dto';
import {
  assertMentorOrAdminOwnsSection,
  assertStudentCanAccessCourse,
} from 'src/common/assert-course-access';

@Injectable()
export class ExamService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExamDto, user: any) {
    const section = await this.prisma.sectionLesson.findUnique({
      where: { id: dto.sectionLessonId },
    });
    if (!section) throw new NotFoundException('Bolim topilmadi');
    await assertMentorOrAdminOwnsSection(this.prisma, user, dto.sectionLessonId);

    const exam = await this.prisma.exam.create({
      data: dto,
      include: { section: { select: { id: true, name: true, courseId: true } } },
    });
    return { success: true, data: exam };
  }

  async findAll(query: any = {}, user: any) {
    if (user.role === 'STUDENT' && !query.sectionLessonId) {
      throw new BadRequestException("sectionLessonId kiritish shart");
    }

    const where: any = {};

    if (query.sectionLessonId) {
      where.sectionLessonId = parseInt(query.sectionLessonId);
      const section = await this.prisma.sectionLesson.findUnique({ where: { id: where.sectionLessonId } });
      if (!section) throw new NotFoundException('Bolim topilmadi');
      await assertStudentCanAccessCourse(this.prisma, user, section.courseId);
    }

    if (query.search) {
      where.question = { contains: query.search, mode: 'insensitive' };
    }

    if (user.role === 'MENTOR' && !query.sectionLessonId) {
      where.section = { course: { mentorId: user.id } };
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [exams, total] = await this.prisma.$transaction([
      this.prisma.exam.findMany({
        where,
        include: { section: { select: { id: true, name: true, courseId: true } } },
        skip,
        take: limit,
      }),
      this.prisma.exam.count({ where }),
    ]);

    if (user.role === 'STUDENT') {
      exams.forEach((exam: any) => delete exam.answer);
    }

    return { success: true, data: exams, total, page, limit };
  }

  async findOne(id: number, user: any) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { section: { select: { id: true, name: true, courseId: true } } },
    });
    if (!exam) throw new NotFoundException('Savol topilmadi');

    await assertStudentCanAccessCourse(this.prisma, user, exam.section.courseId);

    const result: any = { ...exam };
    if (user.role === 'STUDENT') {
      delete result.answer;
    }

    return { success: true, data: result };
  }

  async update(id: number, dto: UpdateExamDto, user: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Savol topilmadi');
    await assertMentorOrAdminOwnsSection(this.prisma, user, exam.sectionLessonId);

    if (dto.sectionLessonId != null && dto.sectionLessonId !== exam.sectionLessonId) {
      const section = await this.prisma.sectionLesson.findUnique({ where: { id: dto.sectionLessonId } });
      if (!section) throw new BadRequestException("Bolim topilmadi");
      await assertMentorOrAdminOwnsSection(this.prisma, user, dto.sectionLessonId);
    }

    const updated = await this.prisma.exam.update({
      where: { id },
      data: dto,
      include: { section: { select: { id: true, name: true, courseId: true } } },
    });
    return { success: true, data: updated };
  }

  async remove(id: number, user: any) {
    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Savol topilmadi');
    await assertMentorOrAdminOwnsSection(this.prisma, user, exam.sectionLessonId);
    await this.prisma.exam.delete({ where: { id } });
    return { success: true, message: "Savol ochirildi" };
  }

  async submitMany(dtos: SubmitExamDto[], currentUser: any) {
    if (!dtos.length) {
      throw new BadRequestException("Javoblar kiritilmadi");
    }

    const sectionLessonId = dtos[0].sectionLessonId;

    const section = await this.prisma.sectionLesson.findUnique({ where: { id: sectionLessonId } });
    if (!section) throw new NotFoundException('Bolim topilmadi');
    await assertStudentCanAccessCourse(this.prisma, currentUser, section.courseId);

    const existingResult = await this.prisma.examResult.findFirst({
      where: { userId: currentUser.id, sectionLessonId },
    });
    if (existingResult) {
      throw new BadRequestException("Siz bu bolim imtihonini allaqachon topshirgansiz");
    }

    for (const dto of dtos) {
      if (dto.sectionLessonId !== sectionLessonId) {
        throw new BadRequestException("Barcha javoblar bir xil bolim (sectionLessonId) uchun bolishi kerak");
      }
    }

    let corrects = 0;
    let wrongs = 0;
    let answered = 0;
    let result: ExamResult;

    await this.prisma.$transaction(async (tx) => {
      for (const dto of dtos) {
        const exam = await tx.exam.findUnique({ where: { id: dto.examId } });
        if (!exam) continue;
        if (exam.sectionLessonId !== sectionLessonId) {
          throw new BadRequestException(`Savol ${dto.examId} tanlangan bolimga tegishli emas`);
        }

        answered++;
        const isCorrect = exam.answer === dto.answer;
        if (isCorrect) corrects++;
        else wrongs++;

        await tx.studentExamQuestion.create({
          data: {
            examId: dto.examId,
            userId: currentUser.id,
            answer: dto.answer,
            isCorrect,
            sectionLessonId: dto.sectionLessonId,
          },
        });
      }

      if (answered === 0) {
        throw new BadRequestException("Yaroqli savollar topilmadi");
      }

      const passed = corrects >= answered * 0.6;

      result = await tx.examResult.create({
        data: {
          userId: currentUser.id,
          sectionLessonId,
          passed,
          corrects,
          wrongs,
        },
        include: {
          user: { select: { id: true, fullName: true } },
          section: { select: { id: true, name: true, courseId: true } },
        },
      });
    });

    return { success: true, data: result! };
  }
}
