import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto, UpdateQuestionDto, CreateQuestionAnswerDto } from './dto/question.dto';
import { assertStudentCanAccessCourse } from 'src/common/assert-course-access';

@Injectable()
export class QuestionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, currentUser: any) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    await assertStudentCanAccessCourse(this.prisma, currentUser, dto.courseId);

    const question = await this.prisma.question.create({
      data: { ...dto, userId: currentUser.id },
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        answer: true,
      },
    });
    return { success: true, data: question };
  }

  async findAll(query: any = {}, currentUser: any) {
    const where: any = {};

    if (query.courseId) where.courseId = parseInt(query.courseId);
    if (query.read !== undefined) where.read = query.read === 'true';

    if (query.search) {
      where.text = { contains: query.search, mode: 'insensitive' };
    }

    if (currentUser.role === 'STUDENT') {
      where.userId = currentUser.id;
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [questions, total] = await this.prisma.$transaction([
      this.prisma.question.findMany({
        where,
        include: {
          answer: { include: { user: { select: { id: true, fullName: true } } } },
          user: { select: { id: true, fullName: true, image: true } },
          course: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.question.count({ where }),
    ]);

    return { success: true, data: questions, total, page, limit };
  }

  async findOne(id: number, viewer: any) {
    const q = await this.prisma.question.findUnique({
      where: { id },
      include: {
        answer: { include: { user: { select: { id: true, fullName: true } } } },
        user: { select: { id: true, fullName: true, image: true } },
        course: { select: { id: true, name: true } },
      },
    });
    if (!q) throw new NotFoundException('Savol topilmadi');

    const staffRoles: UserRole[] = [UserRole.MENTOR, UserRole.ADMIN, UserRole.ASSISTANT];
    if (!q.read && staffRoles.includes(viewer.role as UserRole)) {
      await this.prisma.question.update({
        where: { id },
        data: { read: true, readAt: new Date() },
      });
      q.read = true;
      q.readAt = new Date();
    }

    return { success: true, data: q };
  }

  async update(id: number, dto: UpdateQuestionDto, currentUser: any) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    if (q.userId !== currentUser.id) {
      throw new ForbiddenException("Faqat oz savolingizni tahrirlashingiz mumkin");
    }

    const updated = await this.prisma.question.update({
      where: { id },
      data: { text: dto.text, file: dto.file },
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        answer: true,
      },
    });
    return { success: true, data: updated };
  }

  async remove(id: number, currentUser: any) {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) throw new NotFoundException('Savol topilmadi');
    if (
      currentUser.role !== UserRole.ADMIN &&
      q.userId !== currentUser.id
    ) {
      throw new ForbiddenException("Bu savolni ochirish huquqi yoq");
    }
    await this.prisma.question.delete({ where: { id } });
    return { success: true, message: "Savol ochirildi" };
  }

  async addAnswer(dto: CreateQuestionAnswerDto, currentUser: any) {
    const q = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      include: { answer: true },
    });
    if (!q) throw new NotFoundException('Savol topilmadi');

    if (q.answer) {
      throw new ForbiddenException("Bu savolga allaqachon javob berilgan");
    }

    const answer = await this.prisma.questionAnswer.create({
      data: {
        ...dto,
        userId: currentUser.id,
      },
      include: {
        user: { select: { id: true, fullName: true } },
        question: { select: { id: true, text: true } },
      },
    });

    await this.prisma.question.update({
      where: { id: dto.questionId },
      data: { read: true, readAt: new Date() },
    });

    return { success: true, data: answer };
  }
}
