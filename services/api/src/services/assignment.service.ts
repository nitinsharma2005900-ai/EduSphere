import { MemoryDataStore } from '../database/store';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { UserRole, SubmissionStatus } from '@edusphere/shared';
import { v4 as uuidv4 } from 'uuid';

export class AssignmentService {
  private db = MemoryDataStore.getInstance();

  public async getAssignment(assignmentId: string, userId: string) {
    const assignment = this.db.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    const submission = this.db.assignmentSubmissions.find(
      s => s.assignmentId === assignmentId && s.userId === userId
    );

    return {
      ...assignment,
      submission: submission || null,
    };
  }

  public async submitAssignment(
    assignmentId: string,
    userId: string,
    data: { submissionText?: string; fileUrl?: string; fileName?: string; fileSize?: number }
  ) {
    const assignment = this.db.assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    const enrollment = this.db.enrollments.find(e => e.courseId === assignment.courseId && e.userId === userId);
    if (!enrollment) {
      throw new ForbiddenError('You must be enrolled in this course to submit assignments.');
    }

    let submission = this.db.assignmentSubmissions.find(
      s => s.assignmentId === assignmentId && s.userId === userId
    );

    const now = new Date().toISOString();

    if (!submission) {
      submission = {
        id: `sub-${uuidv4().substring(0, 8)}`,
        assignmentId,
        userId,
        enrollmentId: enrollment.id,
        submissionText: data.submissionText,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        status: SubmissionStatus.SUBMITTED,
        submittedAt: now,
      };
      this.db.assignmentSubmissions.push(submission);
    } else {
      // Re-submission / revision
      submission.submissionText = data.submissionText;
      submission.fileUrl = data.fileUrl;
      submission.fileName = data.fileName;
      submission.fileSize = data.fileSize;
      submission.status = SubmissionStatus.SUBMITTED;
      submission.submittedAt = now;
    }

    return submission;
  }

  public async listSubmissions(assignmentId: string, userRole: UserRole) {
    if (userRole === UserRole.LEARNER) {
      throw new ForbiddenError('Learners are not authorized to view all assignment submissions.');
    }

    const submissions = this.db.assignmentSubmissions.filter(s => s.assignmentId === assignmentId);
    return submissions.map(s => {
      const student = this.db.users.find(u => u.id === s.userId);
      return {
        ...s,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Anonymous Student',
        studentEmail: student?.email,
      };
    });
  }

  public async gradeSubmission(
    submissionId: string,
    graderId: string,
    graderRole: UserRole,
    data: { score: number; feedback: string; rubricScores: Record<string, number> }
  ) {
    // Capstone security: Learners cannot grade submissions or alter scores!
    if (graderRole === UserRole.LEARNER) {
      throw new ForbiddenError('Learners cannot grade submissions or alter scores.');
    }

    const submission = this.db.assignmentSubmissions.find(s => s.id === submissionId);
    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    submission.score = data.score;
    submission.feedback = data.feedback;
    submission.rubricScores = data.rubricScores;
    submission.status = SubmissionStatus.GRADED;
    submission.gradedById = graderId;
    submission.gradedAt = new Date().toISOString();

    // Send grade notification to student
    this.db.notifications.push({
      id: uuidv4(),
      userId: submission.userId,
      title: 'Assignment Graded',
      message: `Your assignment submission has been reviewed and graded. Score: ${data.score}`,
      type: 'GRADE',
      isRead: false,
      linkUrl: `/dashboard/assignments`,
      createdAt: new Date().toISOString(),
    });

    return submission;
  }
}
