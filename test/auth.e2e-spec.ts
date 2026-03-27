import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Testdan so'ng ma'lumotlarni tozalash
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return 404 if user not found', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(404);
    });

    it('should return 401 for invalid password', async () => {
      // Test foydalanuvchisini yaratish
      await prisma.user.upsert({
        where: { email: 'test@example.com' },
        update: {},
        create: {
          email: 'test@example.com',
          fullName: 'Test User',
          password: 'hashed_password', // Haqiqiy bcrypt emas, lekin login baribir xato beradi
          role: 'STUDENT',
        },
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
