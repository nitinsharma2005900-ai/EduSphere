import { MemoryDataStore } from '../database/store';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { EnrollmentStatus } from '@edusphere/shared';
import { v4 as uuidv4 } from 'uuid';

export class EnrollmentService {
  private db = MemoryDataStore.getInstance();

  public async enroll(userId: string, courseId: string, paymentToken?: string) {
    const course = this.db.courses.find(c => c.id === courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }
    if (course.status !== 'PUBLISHED') throw new ForbiddenError('This course is not open for enrollment');
    for (const prerequisiteId of course.prerequisites) {
      if (!this.db.enrollments.some(e => e.userId === userId && e.courseId === prerequisiteId && e.status === EnrollmentStatus.COMPLETED)) {
        throw new ForbiddenError('Complete the prerequisite courses before enrolling');
      }
    }

    // Check duplicate enrollment
    const existing = this.db.enrollments.find(e => e.userId === userId && e.courseId === courseId);
    if (existing) {
      return {
        alreadyEnrolled: true,
        enrollment: existing,
      };
    }

    // Paid course validation
    if (course.isPaid && course.price > 0) {
      if (!paymentToken || !/^tok_sandbox_[a-z_]+$/.test(paymentToken)) {
        throw new ForbiddenError('Payment required to enroll in this paid course. Please initiate sandbox checkout.');
      }
    }

    const now = new Date().toISOString();
    const enrollment = {
      id: `enr-${uuidv4().substring(0, 8)}`,
      userId,
      courseId,
      status: EnrollmentStatus.ACTIVE,
      enrolledAt: now,
      progressPercentage: 0.0,
      lastAccessedAt: now,
    };

    this.db.enrollments.push(enrollment);

    // Initial notification
    this.db.notifications.push({
      id: uuidv4(),
      userId,
      title: 'Course Enrollment Confirmed',
      message: `You are now successfully enrolled in ${course.title}. Start your learning journey today!`,
      type: 'ENROLLMENT',
      isRead: false,
      linkUrl: `/courses/${course.id}/learn`,
      createdAt: now,
    });

    return {
      alreadyEnrolled: false,
      enrollment,
    };
  }

  public async getMyEnrollments(userId: string) {
    const enrollments = this.db.enrollments.filter(e => e.userId === userId);
    return enrollments.map(e => {
      const course = this.db.courses.find(c => c.id === e.courseId);
      const completedLessonsCount = this.db.lessonProgress.filter(lp => lp.enrollmentId === e.id && lp.isCompleted).length;
      const certificate = this.db.certificates.find(cert => cert.enrollmentId === e.id);

      return {
        ...e,
        course: course ? {
          id: course.id,
          title: course.title,
          slug: course.slug,
          thumbnailUrl: course.thumbnailUrl,
          level: course.level,
          durationMinutes: course.durationMinutes,
        } : null,
        completedLessonsCount,
        hasCertificate: Boolean(certificate),
        certificateNumber: certificate?.certificateNumber,
      };
    });
  }

  public async verifyEnrollment(userId: string, courseId: string) {
    const enrollment = this.db.enrollments.find(e => e.userId === userId && e.courseId === courseId);
    return {
      isEnrolled: Boolean(enrollment),
      enrollment: enrollment || null,
    };
  }
}
