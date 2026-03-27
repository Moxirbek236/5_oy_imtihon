import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMentorProfileDto, UpdateMentorProfileDto } from './dto/mentor-profile.dto';

@Injectable()
export class MentorProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMentorProfileDto, currentUser: any) {
    const existing = await this.prisma.mentorProfile.findUnique({
      where: { userId: currentUser.id },
    });
    if (existing) throw new ConflictException('Mentor profil allaqachon mavjud');

    const profile = await this.prisma.mentorProfile.create({
      data: { ...dto, userId: currentUser.id },
      include: {
        user: { select: { id: true, fullName: true, email: true, image: true } },
      },
    });
    return { success: true, data: profile };
  }

  async findAll(query: any = {}) {
    const where: any = {};

    if (query.job) {
      where.job = { contains: query.job, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { job: { contains: query.search, mode: 'insensitive' } },
        { about: { contains: query.search, mode: 'insensitive' } },
        { user: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [profiles, total] = await this.prisma.$transaction([
      this.prisma.mentorProfile.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, phone: true, email: true, image: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.mentorProfile.count({ where }),
    ]);

    return { success: true, data: profiles, total, page, limit };
  }

  async findOne(id: number) {
    const profile = await this.prisma.mentorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            image: true,
            createdCourses: {
              where: { published: true },
              select: { id: true, name: true, price: true, level: true, banner: true },
            },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Mentor profil topilmadi');
    return { success: true, data: profile };
  }

  async update(id: number, dto: UpdateMentorProfileDto, currentUser: any) {
    const profile = await this.prisma.mentorProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Mentor profil topilmadi');
    if (
      currentUser.role === UserRole.MENTOR &&
      profile.userId !== currentUser.id
    ) {
      throw new ForbiddenException("Boshqa mentorning profilini ozgartira olmaysiz");
    }
    const updated = await this.prisma.mentorProfile.update({
      where: { id },
      data: dto,
      include: {
        user: { select: { id: true, fullName: true, email: true, image: true } },
      },
    });
    return { success: true, data: updated };
  }

  async remove(id: number, currentUser: any) {
    const profile = await this.prisma.mentorProfile.findUnique({ where: { id } });
    if (!profile) throw new NotFoundException('Mentor profil topilmadi');
    if (
      currentUser.role === UserRole.MENTOR &&
      profile.userId !== currentUser.id
    ) {
      throw new ForbiddenException("Boshqa mentorning profilini ochira olmaysiz");
    }
    await this.prisma.mentorProfile.delete({ where: { id } });
    return { success: true, message: "Mentor profil ochirildi" };
  }
}
