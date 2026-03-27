import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseCategoryDto, UpdateCourseCategoryDto } from './dto/course-category.dto';

@Injectable()
export class CourseCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseCategoryDto) {
    const category = await this.prisma.courseCategory.create({ data: dto });
    return { success: true, data: category };
  }

  async findAll(query: any = {}) {
    const where: any = {};
    if (query.name) {
      where.name = { contains: query.name, mode: 'insensitive' };
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.courseCategory.findMany({
        where,
        include: { courses: { select: { id: true, name: true, price: true, level: true, mentorId: true } }, _count: { select: { courses: true } } },
        skip,
        take: limit,
      }),
      this.prisma.courseCategory.count({ where }),
    ]);

    return { success: true, data: categories, total, page, limit };
  }

  async findOne(id: number) {
    const category = await this.prisma.courseCategory.findUnique({
      where: { id },
      include: { courses: true },
    });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    return { success: true, data: category };
  }

  async update(id: number, dto: UpdateCourseCategoryDto) {
    const category = await this.prisma.courseCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    const updated = await this.prisma.courseCategory.update({ where: { id }, data: dto });
    return { success: true, data: updated };
  }

  async remove(id: number) {
    const category = await this.prisma.courseCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Kategoriya topilmadi');
    await this.prisma.courseCategory.delete({ where: { id } });
    return { success: true, message: "Kategoriya ochirildi" };
  }
}
