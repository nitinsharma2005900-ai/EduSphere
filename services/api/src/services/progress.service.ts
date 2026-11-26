import { MemoryDataStore } from '../database/store';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { EnrollmentStatus } from '@edusphere/shared';

export class ProgressService {
  private db = MemoryDataStore.getInstance();

  public async getCurriculum(courseId: string, userId: string) {
    const course = this.db.courses.find(c => c.id === courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const enrollment = this.db.enrollments.find(e => e.courseId === courseId && e.userId === userId);
    if (!enrollment) {
      throw new ForbiddenError('You must be enrolled in this course to access the lesson player.');
    }

    const topics = this.db.topics
      .filter(t => t.courseId === courseId)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    let previousLessonCompleted = true; // First lesson is unlocked

    const curriculum = topics.map(topic => {
      const lessons = this.db.lessons
        .filter(l => l.topicId === topic.id)
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map(lesson => {
          const progress = this.db.lessonProgress.find(
            lp => lp.enrollmentId === enrollment.id && lp.lessonId === lesson.id
          );
          const isCompleted = progress?.isCompleted || false;

          // Sequential Lock Logic:
          // A lesson is unlocked IF it is a preview, OR if the previous mandatory lesson was completed
          const isUnlocked = lesson.isPreview || previousLessonCompleted;

          if (lesson.isMandatory) {
            previousLessonCompleted = isCompleted;
          }

          return {
            id: lesson.id,
            topicId: lesson.topicId,
            title: lesson.title,
            slug: lesson.slug,
            description: lesson.description,
            type: lesson.type,
            videoUrl: isUnlocked ? lesson.videoUrl : null, // Protect video URL if locked!
            contentText: isUnlocked ? lesson.contentText : null,
            durationSeconds: lesson.durationSeconds,
            orderIndex: lesson.orderIndex,
            isPreview: lesson.isPreview,
            isMandatory: lesson.isMandatory,
            isCompleted,
            isLocked: !isUnlocked,
            lastPositionSeconds: progress?.lastPositionSeconds || 0,
            resources: isUnlocked ? lesson.resources : [],
          };
        });

      const assessments = this.db.assessments
        .filter(a => a.topicId === topic.id)
        .map(a => {
          const attempts = this.db.assessmentAttempts.filter(
            att => att.assessmentId === a.id && att.userId === userId
          );
          const bestScore = attempts.length > 0 ? Math.max(...attempts.map(att => att.percentage)) : 0;
          const passed = attempts.some(att => att.isPassed);

          return {
            id: a.id,
            title: a.title,
            durationMinutes: a.durationMinutes,
            passingScore: a.passingScore,
            maxAttempts: a.maxAttempts,
            userAttemptsCount: attempts.length,
            userBestScore: bestScore,
            userPassed: passed,
            isLocked: !previousLessonCompleted, // sequential unlock
          };
        });

      const assignments = this.db.assignments
        .filter(asg => asg.topicId === topic.id)
        .map(asg => {
          const submission = this.db.assignmentSubmissions.find(
            sub => sub.assignmentId === asg.id && sub.userId === userId
          );
          return {
            id: asg.id,
            title: asg.title,
            maxScore: asg.maxScore,
            deadline: asg.deadline,
            rubricCriteria: asg.rubricCriteria,
            submission: submission || null,
          };
        });

      return {
        ...topic,
        lessons,
        assessments,
        assignments,
      };
    });

    return {
      course: {
        id: course.id,
        title: course.title,
        progressPercentage: enrollment.progressPercentage,
        status: enrollment.status,
      },
      topics: curriculum,
    };
  }

  public async updateLessonProgress(
    lessonId: string,
    userId: string,
    data: { isCompleted?: boolean; positionSeconds?: number }
  ) {
    const lesson = this.db.lessons.find(l => l.id === lessonId);
    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    const topic = this.db.topics.find(t => t.id === lesson.topicId);
    if (!topic) {
      throw new NotFoundError('Topic not found');
    }

    const enrollment = this.db.enrollments.find(e => e.courseId === topic.courseId && e.userId === userId);
    if (!enrollment) {
      throw new ForbiddenError('You are not enrolled in this course.');
    }

    // Capstone Security Check:
    // Verify sequential unlocking. Learner cannot complete lesson N if lesson N-1 is incomplete!
    const allCourseTopics = this.db.topics.filter(t => t.courseId === topic.courseId).sort((a, b) => a.orderIndex - b.orderIndex);
    const allLessons: any[] = [];
    allCourseTopics.forEach(t => {
      const lsns = this.db.lessons.filter(l => l.topicId === t.id).sort((a, b) => a.orderIndex - b.orderIndex);
      allLessons.push(...lsns);
    });

    const currentIdx = allLessons.findIndex(l => l.id === lessonId);
    if (currentIdx > 0 && !lesson.isPreview) {
      const prevLesson = allLessons[currentIdx - 1];
      if (prevLesson.isMandatory) {
        const prevProg = this.db.lessonProgress.find(lp => lp.enrollmentId === enrollment.id && lp.lessonId === prevLesson.id);
        if (!prevProg || !prevProg.isCompleted) {
          throw new ForbiddenError('Sequential learning restriction: You must complete the previous lesson before advancing or marking this lesson complete.');
        }
      }
    }

    let progress = this.db.lessonProgress.find(lp => lp.enrollmentId === enrollment.id && lp.lessonId === lessonId);
    const now = new Date().toISOString();

    if (!progress) {
      progress = {
        id: `prog-${enrollment.id}-${lessonId}`,
        enrollmentId: enrollment.id,
        lessonId,
        isCompleted: Boolean(data.isCompleted),
        completedAt: data.isCompleted ? now : undefined,
        lastPositionSeconds: data.positionSeconds || 0,
        updatedAt: now,
      };
      this.db.lessonProgress.push(progress);
    } else {
      if (data.isCompleted !== undefined) {
        progress.isCompleted = data.isCompleted;
        if (data.isCompleted && !progress.completedAt) {
          progress.completedAt = now;
        }
      }
      if (data.positionSeconds !== undefined) {
        progress.lastPositionSeconds = data.positionSeconds;
      }
      progress.updatedAt = now;
    }

    // Recalculate total course progress percentage
    const mandatoryLessons = allLessons.filter(l => l.isMandatory);
    const completedMandatoryCount = this.db.lessonProgress.filter(
      lp => lp.enrollmentId === enrollment.id && lp.isCompleted && mandatoryLessons.some(ml => ml.id === lp.lessonId)
    ).length;

    const progressPct = mandatoryLessons.length > 0
      ? Math.round((completedMandatoryCount / mandatoryLessons.length) * 100)
      : 100;

    enrollment.progressPercentage = progressPct;
    if (progressPct >= 100 && enrollment.status !== EnrollmentStatus.COMPLETED) {
      enrollment.status = EnrollmentStatus.COMPLETED;
      enrollment.completedAt = now;
    }
    enrollment.lastAccessedAt = now;

    return {
      success: true,
      lessonProgress: progress,
      courseProgressPercentage: progressPct,
      isCourseCompleted: enrollment.status === EnrollmentStatus.COMPLETED,
    };
  }
}
