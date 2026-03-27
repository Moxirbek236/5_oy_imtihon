import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLessonFileDto } from './dto/lesson-file.dto';
import { assertMentorOrAdminOwnsLesson } from 'src/common/assert-course-access';

@Injectable()
export class LessonFileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLessonFileDto, filePath: string, user: any) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lessonId } });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    await assertMentorOrAdminOwnsLesson(this.prisma, user, dto.lessonId);
    const row = await this.prisma.lessonFile.create({
      data: { lessonId: dto.lessonId, file: filePath, note: dto.note },
      include: { lesson: { select: { id: true, name: true } } },
    });
    return { success: true, data: row };
  }

  async findByLesson(lessonId: number | undefined, query: any = {}) {
    const where: any = {};
    if (lessonId) where.lessonId = lessonId;

    if (query.search) {
      where.note = { contains: query.search, mode: 'insensitive' };
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [files, total] = await this.prisma.$transaction([
      this.prisma.lessonFile.findMany({
        where,
        include: { lesson: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.lessonFile.count({ where }),
    ]);

    return { success: true, data: files, total, page, limit };
  }

  async remove(id: number, user: any) {
    const row = await this.prisma.lessonFile.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Fayl topilmadi');
    await assertMentorOrAdminOwnsLesson(this.prisma, user, row.lessonId);
    await this.prisma.lessonFile.delete({ where: { id } });
    return { success: true, message: "Fayl ochirildi" };
  }
}
