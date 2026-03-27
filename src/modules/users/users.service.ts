import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateUserDto, currentUser: any) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Bu pochta band');
    }

    if (dto.phone) {
      const phoneExists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (phoneExists) throw new ConflictException('Bu telefon raqam band');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone || null,
        fullName: dto.fullName,
        password: hashedPassword,
        role: dto.role || UserRole.STUDENT,
        image: dto.image || null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    return { success: true, data: user };
  }

  async findAll(query: any) {
    const where: any = {};

    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 10;
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          role: true,
          image: true,
          createdAt: true,
          mentorProfile: { select: { id: true, job: true } },
          _count: { select: { assignedCourses: true, purchasedCourses: true } },
        },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { success: true, data: users, total, page, limit };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        image: true,
        createdAt: true,
        mentorProfile: true,
        assignedCourses: {
          include: {
            course: { select: { id: true, name: true, price: true, level: true, banner: true } },
          },
        },
        purchasedCourses: {
          include: {
            course: { select: { id: true, name: true, price: true, level: true, banner: true } },
          },
        },
        _count: { select: { ratings: true, questions: true } },
      },
    });

    if (!user) throw new NotFoundException(`ID: ${id} foydalanuvchi topilmadi`);

    return { success: true, data: user };
  }

  async update(id: number, dto: UpdateUserDto, currentUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`ID: ${id} foydalanuvchi topilmadi`);

    if (currentUser.role === UserRole.STUDENT && currentUser.id !== id) {
      throw new ForbiddenException("Ozganing profilini ozgartira olmaysiz");
    }

    if (currentUser.role === UserRole.MENTOR && currentUser.id !== id) {
      throw new ForbiddenException("Ozganing profilini ozgartira olmaysiz");
    }

    if (dto.role && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Faqat ADMIN rolni ozgartira oladi");
    }

    let hashedPassword = user.password;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Bu email allaqachon biriktirilgan');
    }

    if (dto.phone && dto.phone !== user.phone) {
      const phoneExists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (phoneExists) throw new ConflictException('Bu telefon raqam allaqachon band');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email || user.email,
        phone: dto.phone !== undefined ? dto.phone : user.phone,
        fullName: dto.fullName || user.fullName,
        password: hashedPassword,
        role: dto.role || user.role,
        image: dto.image !== undefined ? dto.image : user.image,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        image: true,
        createdAt: true,
        mentorProfile: { select: { id: true, job: true } },
      },
    });

    return { success: true, data: updated };
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`ID: ${id} foydalanuvchi topilmadi`);

    if (user.role === UserRole.ADMIN) {
      throw new ForbiddenException("Admin foydalanuvchini ochirib bolmaydi");
    }

    await this.prisma.user.delete({ where: { id } });

    return { success: true, message: "Foydalanuvchi ochirildi" };
  }
}
