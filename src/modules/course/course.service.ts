import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { UserRole, PaidVia } from '@prisma/client';
import { LastActivityService } from '../last-activity/last-activity.service';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lastActivityService: LastActivityService,
  ) {}

  async create(dto: CreateCourseDto, currentUser: any) {
    const category = await this.prisma.courseCategory.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Kategoriya topilmadi');

    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        about: dto.about,
        price: dto.price,
        banner: dto.banner || '',
        introVideo: dto.introVideo,
        level: dto.level,
        published: dto.published || false,
        categoryId: dto.categoryId,
        mentorId: currentUser.id,
      },
      include: {
        category: true,
        mentor: { select: { id: true, fullName: true, image: true } },
      },
    });
    return { success: true, data: course };
  }

  async findAll(query: any = {}) {
    const where: any = { published: true };

    if (query.categoryId) where.categoryId = parseInt(query.categoryId);
    if (query.level) where.level = query.level;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { about: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        include: {
          category: true,
          mentor: { select: { id: true, fullName: true, image: true } },
          purchasedCourses: {
            include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
          },
          _count: { select: { ratings: true, purchasedCourses: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);
    return { success: true, data: courses, total, page, limit };
  }

  async findMe(user: any, query: any) {
    const where: any = { mentorId: user.id };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { about: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.published !== undefined) where.published = query.published === 'true';

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        include: {
          category: true,
          purchasedCourses: {
            include: { user: { select: { id: true, fullName: true, image: true, email: true, phone: true } } }
          },
          _count: { select: { ratings: true, purchasedCourses: true, sections: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);
    return { success: true, data: courses, total, page, limit };
  }

  async findMyPurchased(user: any, query: any) {
    const where: any = {
      OR: [
        { purchasedCourses: { some: { userId: user.id } } },
        { assignedCourses: { some: { userId: user.id } } },
      ],
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { about: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        include: {
          category: true,
          mentor: { select: { id: true, fullName: true, image: true } },
          _count: { select: { ratings: true, sections: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    return { success: true, data: courses, total, page, limit };
  }

  async findOne(id: number, currentUser?: any) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        mentor: { select: { id: true, fullName: true, image: true, mentorProfile: true } },
        sections: {
          include: { 
            lessons: {
              include: {
                lessonViews: currentUser ? { where: { userId: currentUser.id } } : false,
              }
            } 
          },
        },
        ratings: {
          include: { user: { select: { id: true, fullName: true, image: true } } },
        },
        purchasedCourses: currentUser ? {
          where: (currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.ASSISTANT) ? { userId: currentUser.id } : {},
          include: { user: { select: { id: true, fullName: true, image: true, email: true, phone: true } } }
        } : false,
        _count: { select: { ratings: true, purchasedCourses: true } },
      },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    if (currentUser && currentUser.role === UserRole.STUDENT) {
      await this.lastActivityService.upsert(currentUser.id, { courseId: id });
    }

    return { success: true, data: course };
  }

  async update(id: number, dto: UpdateCourseDto, currentUser: any) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    if (
      currentUser.role === UserRole.MENTOR &&
      course.mentorId !== currentUser.id
    ) {
      throw new ForbiddenException("Bu kursni ozgartirish huquqi yoq");
    }

    if (dto.categoryId !== undefined) {
      const category = await this.prisma.courseCategory.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException('Kategoriya topilmadi');
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        mentor: { select: { id: true, fullName: true, image: true } },
      },
    });
    return { success: true, data: updated };
  }

  async remove(id: number, currentUser: any) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    if (
      currentUser.role === UserRole.MENTOR &&
      course.mentorId !== currentUser.id
    ) {
      throw new ForbiddenException("Bu kursni ochirish huquqi yoq");
    }

    await this.prisma.course.delete({ where: { id } });
    return { success: true, message: "Kurs ochirildi" };
  }

  async assignStudentToCourse(courseId: number, studentId: number, currentUser: any) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    if (currentUser.role === UserRole.MENTOR && course.mentorId !== currentUser.id) {
      throw new ForbiddenException("Bu kursga talaba biriktira olmaysiz");
    }

    const student = await this.prisma.user.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Talaba topilmadi');
    if (student.role !== UserRole.STUDENT) {
      throw new BadRequestException('Faqat STUDENT roli biriktirilishi mumkin');
    }

    const assigned = await this.prisma.assignedCourse.upsert({
      where: { userId_courseId: { userId: studentId, courseId } },
      create: { userId: studentId, courseId },
      update: {},
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        course: { select: { id: true, name: true } },
      },
    });
    return { success: true, data: assigned };
  }

  async purchaseCourse(courseId: number, paidVia: PaidVia, currentUser: any) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    const purchased = await this.prisma.purchasedCourse.upsert({
      where: { courseId_userId: { courseId: courseId, userId: currentUser.id } },
      create: { courseId: courseId, userId: currentUser.id, paidVia, amount: course.price },
      update: {},
      include: {
        course: true,
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });
    return { success: true, data: purchased };
  }
}
