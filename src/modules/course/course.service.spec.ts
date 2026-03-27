import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from './course.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { LastActivityService } from '../last-activity/last-activity.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole, CourseLevel } from '@prisma/client';

describe('CourseService', () => {
  let service: CourseService;
  let prisma: PrismaService;
  let lastActivity: LastActivityService;

  const mockPrismaService = {
    course: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    courseCategory: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockLastActivityService = {
    upsert: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LastActivityService, useValue: mockLastActivityService },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    prisma = module.get<PrismaService>(PrismaService);
    lastActivity = module.get<LastActivityService>(LastActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a course if found', async () => {
      const courseId = 1;
      const mockCourse = { id: courseId, name: 'Test Course' };
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findOne(courseId);

      expect(result).toEqual({ success: true, data: mockCourse });
      expect(prisma.course.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: courseId }
      }));
    });

    it('should throw NotFoundException if course not found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should update last activity if student views course', async () => {
      const courseId = 1;
      const student = { id: 2, role: UserRole.STUDENT };
      const mockCourse = { id: courseId, name: 'Test Course' };
      
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      await service.findOne(courseId, student);

      expect(lastActivity.upsert).toHaveBeenCalledWith(student.id, { courseId });
    });
  });

  describe('create', () => {
    it('should create a new course', async () => {
      const dto = {
        name: 'New Course',
        about: 'About',
        price: 100,
        level: CourseLevel.BEGINNER,
        categoryId: 1
      };
      const user = { id: 1, role: UserRole.MENTOR };
      
      mockPrismaService.courseCategory.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.course.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto as any, user);

      expect(result.success).toBe(true);
      expect(prisma.course.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if category does not exist', async () => {
      mockPrismaService.courseCategory.findUnique.mockResolvedValue(null);

      await expect(service.create({ categoryId: 999 } as any, { id: 1 })).rejects.toThrow(BadRequestException);
    });
  });
});
