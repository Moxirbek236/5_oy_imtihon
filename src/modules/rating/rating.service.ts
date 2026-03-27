import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRatingDto, UpdateRatingDto } from './dto/rating.dto';

@Injectable()
export class RatingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRatingDto, currentUser: any) {
    const course = await this.prisma.course.findUnique({ where: { id: dto.courseId } });
    if (!course) throw new NotFoundException('Kurs topilmadi');

    if (currentUser.role === UserRole.STUDENT) {
      const purchased = await this.prisma.purchasedCourse.findUnique({
        where: { courseId_userId: { courseId: dto.courseId, userId: currentUser.id } },
      });
      if (!purchased) {
        const assigned = await this.prisma.assignedCourse.findUnique({
          where: { userId_courseId: { userId: currentUser.id, courseId: dto.courseId } },
        });
        if (!assigned) {
          throw new ForbiddenException("Siz ushbu kursni sotib olmagansiz yoki biriktirilmagansiz");
        }
      }
    }

    const existingRating = await this.prisma.rating.findFirst({
      where: { userId: currentUser.id, courseId: dto.courseId },
    });
    if (existingRating) {
      throw new BadRequestException("Siz bu kursga allaqachon baho bergansiz");
    }

    const rating = await this.prisma.rating.create({
      data: { ...dto, userId: currentUser.id },
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        course: { select: { id: true, name: true } },
      },
    });
    return { success: true, data: rating };
  }

  async findAll(query: any = {}) {
    const where: any = {};

    if (query.courseId) where.courseId = parseInt(query.courseId);
    if (query.rate) where.rate = parseInt(query.rate);
    if (query.userId) where.userId = parseInt(query.userId);

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [ratings, total] = await this.prisma.$transaction([
      this.prisma.rating.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, image: true } },
          course: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.rating.count({ where }),
    ]);

    return { success: true, data: ratings, total, page, limit };
  }

  async findOne(id: number) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        course: { select: { id: true, name: true } },
      },
    });
    if (!rating) throw new NotFoundException('Rating topilmadi');
    return { success: true, data: rating };
  }

  async update(id: number, dto: UpdateRatingDto, currentUser: any) {
    const rating = await this.prisma.rating.findUnique({ where: { id } });
    if (!rating) throw new NotFoundException('Rating topilmadi');
    if (
      currentUser.role !== UserRole.ADMIN &&
      rating.userId !== currentUser.id
    ) {
      throw new ForbiddenException("Boshqa foydalanuvchining bahosini ozgartira olmaysiz");
    }

    if (dto.courseId && dto.courseId !== rating.courseId) {
      throw new BadRequestException("Baho kursini ozgartirish mumkin emas");
    }

    const updated = await this.prisma.rating.update({
      where: { id },
      data: { rate: dto.rate, comment: dto.comment },
      include: {
        user: { select: { id: true, fullName: true, image: true } },
        course: { select: { id: true, name: true } },
      },
    });
    return { success: true, data: updated };
  }

  async remove(id: number, currentUser: any) {
    const rating = await this.prisma.rating.findUnique({ where: { id } });
    if (!rating) throw new NotFoundException('Rating topilmadi');
    if (
      currentUser.role !== UserRole.ADMIN &&
      rating.userId !== currentUser.id
    ) {
      throw new ForbiddenException("Boshqa foydalanuvchining bahosini ochira olmaysiz");
    }
    await this.prisma.rating.delete({ where: { id } });
    return { success: true, message: "Rating ochirildi" };
  }
}
