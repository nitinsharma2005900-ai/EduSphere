import { z } from 'zod';

// ============================================================================
// Roles & Permissions
// ============================================================================
export enum UserRole {
  LEARNER = 'LEARNER',
  INSTRUCTOR = 'INSTRUCTOR',
  COURSE_AUTHOR = 'COURSE_AUTHOR',
  ASSESSOR = 'ASSESSOR',
  ADMIN = 'ADMIN',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum LessonType {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  ATTACHMENT = 'ATTACHMENT',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  SUSPENDED = 'SUSPENDED',
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
}

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  EXPIRED = 'EXPIRED',
}

export enum SubmissionStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  GRADED = 'GRADED',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum NotificationType {
  ENROLLMENT = 'ENROLLMENT',
  ASSESSMENT = 'ASSESSMENT',
  GRADE = 'GRADE',
  CERTIFICATE = 'CERTIFICATE',
  SYSTEM = 'SYSTEM',
}

// ============================================================================
// Interfaces & DTOs
// ============================================================================
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface CourseDto {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  description: string;
  thumbnailUrl: string;
  categoryId: string;
  categoryName?: string;
  level: CourseLevel;
  price: number;
  isPaid: boolean;
  status: CourseStatus;
  durationMinutes: number;
  learningObjectives: string[];
  prerequisites: string[];
  authorId: string;
  authorName?: string;
  instructorId: string;
  instructorName?: string;
  version: number;
  enrolledCount?: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonDto {
  id: string;
  topicId: string;
  title: string;
  slug: string;
  description?: string | null;
  type: LessonType;
  videoUrl?: string | null;
  contentText?: string | null;
  durationSeconds: number;
  orderIndex: number;
  isPreview: boolean;
  isMandatory: boolean;
  resources?: LessonResourceDto[];
  isCompleted?: boolean;
  isLocked?: boolean;
}

export interface LessonResourceDto {
  id: string;
  lessonId: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isDownloadable: boolean;
}

export interface TopicDto {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  lessons: LessonDto[];
  assessments?: AssessmentDto[];
  assignments?: AssignmentDto[];
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionDto {
  id: string;
  prompt: string;
  type: QuestionType;
  points: number;
  orderIndex: number;
  options: QuestionOption[];
  explanation?: string | null;
  // correct answers are omitted when viewed by learners prior to submission!
}

export interface AssessmentDto {
  id: string;
  topicId: string;
  courseId: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
  deadline?: string | null;
  isStrictSequential: boolean;
  version: number;
  questionCount?: number;
  totalPoints?: number;
  questions?: QuestionDto[];
  userAttemptsCount?: number;
  userBestScore?: number | null;
  userPassed?: boolean;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
}

export interface AssignmentDto {
  id: string;
  topicId: string;
  courseId: string;
  title: string;
  instructions: string;
  maxScore: number;
  deadline?: string | null;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  rubricCriteria: RubricCriterion[];
  submission?: AssignmentSubmissionDto | null;
}

export interface AssignmentSubmissionDto {
  id: string;
  assignmentId: string;
  userId: string;
  userName?: string;
  submissionText?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  status: SubmissionStatus;
  submittedAt: string;
  score?: number | null;
  feedback?: string | null;
  rubricScores?: Record<string, number> | null;
  gradedBy?: string | null;
  gradedAt?: string | null;
}

export interface CertificateDto {
  id: string;
  certificateNumber: string;
  userId: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  completionDate: string;
  verificationUrl: string;
  qrCodeData: string;
  issuerName: string;
  isRevoked: boolean;
  revocationReason?: string | null;
  pdfUrl?: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

// ============================================================================
// API Response Wrapper
// ============================================================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    requestId?: string;
    timestamp?: string;
  };
}

// ============================================================================
// Validation Schemas
// ============================================================================
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  role: z.nativeEnum(UserRole).default(UserRole.LEARNER),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const AssessmentSubmissionSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.record(z.string(), z.array(z.string()).or(z.string())),
});

export const AssignmentSubmissionSchema = z.object({
  assignmentId: z.string().uuid(),
  submissionText: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
});

export const GradeAssignmentSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().min(1, 'Feedback is required'),
  rubricScores: z.record(z.string(), z.number()),
});
