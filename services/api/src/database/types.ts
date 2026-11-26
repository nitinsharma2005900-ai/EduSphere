import bcrypt from 'bcryptjs';
import { UserRole, CourseStatus, CourseLevel, LessonType, QuestionType, SubmissionStatus, EnrollmentStatus } from '@edusphere/shared';

export interface DbUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbCourse {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  thumbnailUrl: string;
  categoryId: string;
  level: CourseLevel;
  price: number;
  isPaid: boolean;
  status: CourseStatus;
  durationMinutes: number;
  learningObjectives: string[];
  prerequisites: string[]; // Course IDs required
  authorId: string;
  instructorId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbTopic {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface DbLesson {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  description?: string;
  type: LessonType;
  videoUrl?: string;
  contentText?: string;
  durationSeconds: number;
  orderIndex: number;
  isPreview: boolean;
  isMandatory: boolean;
  resources: DbLessonResource[];
  createdAt: string;
  updatedAt: string;
}

export interface DbLessonResource {
  id: string;
  lessonId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isDownloadable: boolean;
  createdAt: string;
}

export interface DbEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt?: string;
  progressPercentage: number;
  lastAccessedAt: string;
}

export interface DbLessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: string;
  lastPositionSeconds: number;
  updatedAt: string;
}

export interface DbQuestion {
  id: string;
  assessmentId: string;
  prompt: string;
  type: QuestionType;
  points: number;
  orderIndex: number;
  options: { id: string; text: string }[];
  correctAnswers: string[];
  explanation?: string;
}

export interface DbAssessment {
  id: string;
  courseId: string;
  topicId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
  deadline?: string;
  isStrictSequential: boolean;
  version: number;
  questions: DbQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface DbAssessmentAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  enrollmentId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt?: string;
  durationSeconds?: number;
  score: number;
  percentage: number;
  isPassed: boolean;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';
  answers: Record<string, any>;
  feedback?: any;
  versionNumber: number;
}

export interface DbAssignment {
  id: string;
  courseId: string;
  topicId: string;
  title: string;
  instructions: string;
  maxScore: number;
  deadline?: string;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  rubricCriteria: { id: string; title: string; description: string; maxPoints: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface DbAssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  enrollmentId: string;
  submissionText?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  status: SubmissionStatus;
  submittedAt: string;
  score?: number;
  feedback?: string;
  rubricScores?: Record<string, number>;
  gradedById?: string;
  gradedAt?: string;
}

export interface DbCertificate {
  id: string;
  certificateNumber: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  issueDate: string;
  completionDate: string;
  verificationUrl: string;
  qrCodeData: string;
  issuerName: string;
  isRevoked: boolean;
  revocationReason?: string;
  revokedAt?: string;
  revokedById?: string;
  metadata: any;
  createdAt: string;
}

export interface DbNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface DbPayment {
  id: string;
  orderId: string;
  paymentId?: string;
  userId: string;
  courseId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface DbAuditLog {
  id: string;
  userId?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  timestamp: string;
}
