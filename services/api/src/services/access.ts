import { MemoryDataStore } from '../database/store';
import { UserRole } from '@edusphere/shared';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export function requireCourseAccess(courseId: string, userId: string, edit = false) {
  const db = MemoryDataStore.getInstance();
  const course = db.courses.find(c => c.id === courseId);
  const user = db.users.find(u => u.id === userId && u.isActive);
  if (!course) throw new NotFoundError('Course not found');
  if (!user) throw new ForbiddenError('User not active');
  if (user.role === UserRole.ADMIN || course.authorId === userId || course.instructorId === userId) return course;
  if (!edit && (user.role === UserRole.ASSESSOR || db.enrollments.some(e => e.courseId === courseId && e.userId === userId && e.status !== 'SUSPENDED'))) return course;
  throw new ForbiddenError('You do not have access to this course');
}
