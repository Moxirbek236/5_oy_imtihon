import { Test, TestingModule } from '@nestjs/testing';
import { RatingService } from './rating.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('RatingService (Integration)', () => {
  let service: RatingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    course: {
      findUnique: jest.fn(),
    },
    purchasedCourse: {
      findUnique: jest.fn(),
    },
    assignedCourse: {
      findUnique: jest.fn(),
    },
    rating: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create rating integration logic', () => {
    it('should throw ForbiddenException if student has not purchased or been assigned the course', async () => {
      const dto = { courseId: 1, rate: 5, comment: 'Good' };
      const student = { id: 2, role: UserRole.STUDENT };

      mockPrismaService.course.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.purchasedCourse.findUnique.mockResolvedValue(null);
      mockPrismaService.assignedCourse.findUnique.mockResolvedValue(null);

      await expect(service.create(dto as any, student)).rejects.toThrow(ForbiddenException);
    });

    it('should allow rating if student has purchased the course', async () => {
      const dto = { courseId: 1, rate: 5, comment: 'Good' };
      const student = { id: 2, role: UserRole.STUDENT };

      mockPrismaService.course.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.purchasedCourse.findUnique.mockResolvedValue({ userId: 2, courseId: 1 });
      mockPrismaService.rating.findFirst.mockResolvedValue(null);
      mockPrismaService.rating.create.mockResolvedValue({ id: 100, ...dto });

      const result = await service.create(dto as any, student);
      expect(result.success).toBe(true);
      expect(prisma.rating.create).toHaveBeenCalled();
    });
  });
});
