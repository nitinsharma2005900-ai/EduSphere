import { MemoryDataStore } from '../database/store';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { config } from '../config';
import { UserRole } from '@edusphere/shared';
import { v4 as uuidv4 } from 'uuid';

export class AssessmentService {
  private db = MemoryDataStore.getInstance();

  public async getAssessment(assessmentId: string, userRole: UserRole) {
    const assessment = this.db.assessments.find(a => a.id === assessmentId);
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    // Security requirement: Hide correct answers from learners!
    const isAuthorOrAdmin = userRole === UserRole.ADMIN || userRole === UserRole.COURSE_AUTHOR || userRole === UserRole.INSTRUCTOR;

    const sanitizedQuestions = assessment.questions.map(q => ({
      id: q.id,
      prompt: q.prompt,
      type: q.type,
      points: q.points,
      orderIndex: q.orderIndex,
      options: q.options,
      correctAnswers: isAuthorOrAdmin ? q.correctAnswers : undefined,
      explanation: isAuthorOrAdmin ? q.explanation : undefined,
    }));

    return {
      ...assessment,
      questions: sanitizedQuestions,
    };
  }

  public async startAttempt(assessmentId: string, userId: string) {
    const assessment = this.db.assessments.find(a => a.id === assessmentId);
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    const enrollment = this.db.enrollments.find(e => e.courseId === assessment.courseId && e.userId === userId);
    if (!enrollment) {
      throw new ForbiddenError('You must be enrolled in this course to take this assessment.');
    }

    // Enforce Attempt Limit
    const existingAttempts = this.db.assessmentAttempts.filter(
      att => att.assessmentId === assessmentId && att.userId === userId
    );

    if (existingAttempts.length >= assessment.maxAttempts) {
      throw new ForbiddenError(
        `Attempt limit exceeded: You have used all ${assessment.maxAttempts} allowed attempts for this assessment.`
      );
    }

    const attemptNumber = existingAttempts.length + 1;
    const now = new Date().toISOString();

    const newAttempt: any = {
      id: `atm-${assessmentId}-${userId}-${attemptNumber}`,
      assessmentId,
      userId,
      enrollmentId: enrollment.id,
      attemptNumber,
      startedAt: now,
      score: 0.0,
      percentage: 0.0,
      isPassed: false,
      status: 'IN_PROGRESS',
      answers: {},
      versionNumber: assessment.version,
    };

    this.db.assessmentAttempts.push(newAttempt);
    return newAttempt;
  }

  public async submitAttempt(
    assessmentId: string,
    userId: string,
    answers: Record<string, any>
  ) {
    const assessment = this.db.assessments.find(a => a.id === assessmentId);
    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    const enrollment = this.db.enrollments.find(e => e.courseId === assessment.courseId && e.userId === userId);
    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this course.');
    }

    // Find in-progress attempt or check attempt limits
    let attempt: any = this.db.assessmentAttempts.find(
      att => att.assessmentId === assessmentId && att.userId === userId && att.status === 'IN_PROGRESS'
    );

    if (!attempt) {
      const allAttempts = this.db.assessmentAttempts.filter(
        att => att.assessmentId === assessmentId && att.userId === userId
      );
      if (allAttempts.length >= assessment.maxAttempts) {
        throw new ForbiddenError(`Maximum attempt limit of ${assessment.maxAttempts} has been reached.`);
      }
      // Create new attempt record
      attempt = await this.startAttempt(assessmentId, userId);
    }

    // Deterministic Evaluation via Python Microservice OR internal deterministic fallback
    let gradingResult: any = null;
    try {
      const response = await fetch(`${config.analyticsServiceUrl}/api/v1/grading/evaluate-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': config.internalServiceKey,
        },
        body: JSON.stringify({
          assessment_id: assessment.id,
          passing_score: assessment.passingScore,
          questions: assessment.questions.map(q => ({
            id: q.id,
            prompt: q.prompt,
            type: q.type,
            points: q.points,
            correct_answers: q.correctAnswers,
            options: q.options,
            explanation: q.explanation,
          })),
          student_answers: answers,
        }),
      });

      if (response.ok) {
        gradingResult = await response.json();
      }
    } catch {
      // Fallback local deterministic scoring
    }

    if (!gradingResult) {
      gradingResult = this.localDeterministicGrade(assessment, answers);
    }

    const now = new Date().toISOString();
    attempt.status = 'GRADED';
    attempt.submittedAt = now;
    attempt.answers = answers;
    attempt.score = gradingResult.total_score || gradingResult.totalScore;
    attempt.percentage = gradingResult.percentage;
    attempt.isPassed = gradingResult.is_passed !== undefined ? gradingResult.is_passed : gradingResult.isPassed;
    attempt.feedback = gradingResult.breakdown;

    // Send notification
    this.db.notifications.push({
      id: uuidv4(),
      userId,
      title: 'Assessment Graded',
      message: `Your score for ${assessment.title}: ${attempt.percentage}% (${attempt.isPassed ? 'PASSED' : 'NOT PASSED'}).`,
      type: 'GRADE',
      isRead: false,
      linkUrl: `/courses/${assessment.courseId}/learn`,
      createdAt: now,
    });

    return attempt;
  }

  private localDeterministicGrade(assessment: any, answers: Record<string, any>) {
    let totalScore = 0;
    let maxScore = 0;
    const breakdown = assessment.questions.map((q: any) => {
      maxScore += q.points;
      const userAns = answers[q.id];
      let awarded = 0;
      let isCorrect = false;

      if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
        const correct = q.correctAnswers[0];
        if (userAns && String(userAns).trim().toLowerCase() === String(correct).trim().toLowerCase()) {
          awarded = q.points;
          isCorrect = true;
        }
      } else if (q.type === 'MULTIPLE_CHOICE') {
        const userSet = new Set(Array.isArray(userAns) ? userAns : [userAns]);
        const correctSet = new Set(q.correctAnswers);
        const tp = [...userSet].filter(x => correctSet.has(x)).length;
        const fp = [...userSet].filter(x => !correctSet.has(x)).length;
        if (tp === correctSet.size && fp === 0) {
          awarded = q.points;
          isCorrect = true;
        } else {
          awarded = Math.max(0, (tp / correctSet.size - 0.5 * (fp / Math.max(1, q.options.length - correctSet.size))) * q.points);
        }
      }

      totalScore += awarded;
      return {
        question_id: q.id,
        is_correct: isCorrect,
        points_awarded: Math.round(awarded * 100) / 100,
        max_points: q.points,
        user_answer: userAns,
        correct_answers: q.correctAnswers,
        explanation: q.explanation,
      };
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;
    return {
      total_score: totalScore,
      max_score: maxScore,
      percentage,
      is_passed: percentage >= assessment.passingScore,
      breakdown,
    };
  }
}
