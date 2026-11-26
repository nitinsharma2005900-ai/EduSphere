import { MemoryDataStore } from '../database/store';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { UserRole } from '@edusphere/shared';
import { v4 as uuidv4 } from 'uuid';

export class CertificateService {
  private db = MemoryDataStore.getInstance();

  /**
   * Capstone Server-Side Certificate Authorization
   * Verifies that:
   * 1. The user is enrolled in the course.
   * 2. 100% of all mandatory lessons are completed.
   * 3. All required course assessments have been attempted and PASSED.
   * 4. No duplicate certificate exists.
   */
  public async claimCertificate(courseId: string, userId: string) {
    const course = this.db.courses.find(c => c.id === courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const user = this.db.users.find(u => u.id === userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const enrollment = this.db.enrollments.find(e => e.courseId === courseId && e.userId === userId);
    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this course.');
    }

    // Check duplicate
    const existingCert = this.db.certificates.find(c => c.enrollmentId === enrollment.id && !c.isRevoked);
    if (existingCert) {
      return existingCert;
    }

    // 1. Verify Mandatory Lesson Completion
    const courseTopics = this.db.topics.filter(t => t.courseId === courseId);
    const topicIds = courseTopics.map(t => t.id);
    const mandatoryLessons = this.db.lessons.filter(l => topicIds.includes(l.topicId) && l.isMandatory);

    const completedLessonIds = new Set(
      this.db.lessonProgress
        .filter(lp => lp.enrollmentId === enrollment.id && lp.isCompleted)
        .map(lp => lp.lessonId)
    );

    const incompleteLessons = mandatoryLessons.filter(l => !completedLessonIds.has(l.id));
    if (incompleteLessons.length > 0) {
      throw new ForbiddenError(
        `Certificate Eligibility Requirement Not Met: You have ${incompleteLessons.length} incomplete mandatory lessons. You must complete 100% of course lessons before claiming a certificate.`
      );
    }

    // 2. Verify Assessment Passing Status
    const courseAssessments = this.db.assessments.filter(a => a.courseId === courseId);
    for (const assess of courseAssessments) {
      const passedAttempt = this.db.assessmentAttempts.find(
        att => att.assessmentId === assess.id && att.userId === userId && att.isPassed
      );
      if (!passedAttempt) {
        throw new ForbiddenError(
          `Certificate Eligibility Requirement Not Met: You must achieve a passing grade on '${assess.title}' before a certificate can be issued.`
        );
      }
    }

    // Generate unique certificate ID
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certNumber = `EDU-2026-${course.title.substring(0, 3).toUpperCase()}-${randomSuffix}`;
    const now = new Date().toISOString();
    const verificationUrl = `http://localhost:3000/verify/${certNumber}`;
    const qrCodeData = `EDUSPHERE|CERT:${certNumber}|VERIFY:${verificationUrl}`;

    const newCertificate = {
      id: `cert-${enrollment.id}`,
      certificateNumber: certNumber,
      userId: user.id,
      courseId: course.id,
      enrollmentId: enrollment.id,
      issueDate: now,
      completionDate: now,
      verificationUrl,
      qrCodeData,
      issuerName: 'EduSphere Academic Board & Dean Eleanor Vance',
      isRevoked: false,
      metadata: {
        learnerName: `${user.firstName} ${user.lastName}`,
        courseTitle: course.title,
        verificationUrl,
      },
      createdAt: now,
    };

    this.db.certificates.push(newCertificate);

    // Send notification
    this.db.notifications.push({
      id: uuidv4(),
      userId: user.id,
      title: 'Certificate Issued!',
      message: `Congratulations! Your certificate for ${course.title} has been officially issued (${certNumber}).`,
      type: 'CERTIFICATE',
      isRead: false,
      linkUrl: `/dashboard/certificates`,
      createdAt: now,
    });

    return newCertificate;
  }

  public async getMyCertificates(userId: string) {
    const certs = this.db.certificates.filter(c => c.userId === userId);
    return certs.map(c => {
      const course = this.db.courses.find(crs => crs.id === c.courseId);
      const user = this.db.users.find(u => u.id === c.userId);
      return {
        ...c,
        courseTitle: course?.title || 'Course',
        learnerName: user ? `${user.firstName} ${user.lastName}` : 'Learner',
      };
    });
  }

  public async verifyPublicCertificate(certificateNumber: string) {
    const cert = this.db.certificates.find(c => c.certificateNumber === certificateNumber);
    if (!cert) {
      throw new NotFoundError('Certificate not found or invalid certificate number');
    }

    const course = this.db.courses.find(c => c.id === cert.courseId);
    const user = this.db.users.find(u => u.id === cert.userId);

    return {
      isValid: !cert.isRevoked,
      certificateNumber: cert.certificateNumber,
      learnerName: user ? `${user.firstName} ${user.lastName}` : 'Authorized Student',
      courseTitle: course?.title || 'EduSphere Certified Course',
      issueDate: cert.issueDate,
      issuerName: cert.issuerName,
      isRevoked: cert.isRevoked,
      revocationReason: cert.revocationReason,
      revokedAt: cert.revokedAt,
    };
  }

  public async revokeCertificate(certId: string, adminId: string, userRole: UserRole, reason: string) {
    if (userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can revoke certificates');
    }

    const cert = this.db.certificates.find(c => c.id === certId || c.certificateNumber === certId);
    if (!cert) {
      throw new NotFoundError('Certificate not found');
    }

    cert.isRevoked = true;
    cert.revocationReason = reason;
    cert.revokedAt = new Date().toISOString();
    cert.revokedById = adminId;

    // Log audit
    this.db.auditLogs.push({
      id: uuidv4(),
      userId: adminId,
      userRole: UserRole.ADMIN,
      action: 'CERTIFICATE_REVOCATION',
      entity: 'Certificate',
      entityId: cert.id,
      details: { certificateNumber: cert.certificateNumber, reason },
      timestamp: new Date().toISOString(),
    });

    return cert;
  }
}
