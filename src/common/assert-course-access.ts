import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export async function assertMentorOrAdminOwnsCourse(
  prisma: PrismaService,
  user: { id: number; role: string },
  courseId: number,
): Promise<void> {
  if (user.role === UserRole.ADMIN) return;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundException('Kurs topilmadi');
  if (user.role !== UserRole.MENTOR || course.mentorId !== user.id) {
    throw new ForbiddenException("Bu kurs boyicha amal bajarish huquqi yoq");
  }
}

export async function assertMentorOrAdminOwnsSection(
  prisma: PrismaService,
  user: { id: number; role: string },
  sectionId: number,
): Promise<void> {
  const section = await prisma.sectionLesson.findUnique({ where: { id: sectionId } });
  if (!section) throw new NotFoundException('Bo\'lim topilmadi');
  await assertMentorOrAdminOwnsCourse(prisma, user, section.courseId);
}

export async function assertMentorOrAdminOwnsLesson(
  prisma: PrismaService,
  user: { id: number; role: string },
  lessonId: number,
): Promise<void> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { select: { courseId: true } } },
  });
  if (!lesson) throw new NotFoundException('Dars topilmadi');
  await assertMentorOrAdminOwnsCourse(prisma, user, lesson.section.courseId);
}

export async function assertStudentCanAccessCourse(
  prisma: PrismaService,
  user: { id: number; role: string },
  courseId: number,
): Promise<void> {
  if (user.role === UserRole.ADMIN || user.role === UserRole.ASSISTANT) return;
  
  if (user.role === UserRole.MENTOR) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    if (course.mentorId !== user.id) {
      throw new ForbiddenException("Bu kursni korish huquqi yoq (Mentor)");
    }
    return;
  }

  const purchased = await prisma.purchasedCourse.findUnique({
    where: { courseId_userId: { courseId, userId: user.id } },
  });
  if (purchased) return;

  const assigned = await prisma.assignedCourse.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (assigned) return;

  throw new ForbiddenException("Bu kursni korish huquqi yoq, avval sotib oling");
}
