import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import {
  DbUser, DbCategory, DbCourse, DbTopic, DbLesson, DbEnrollment,
  DbLessonProgress, DbAssessment, DbAssessmentAttempt, DbAssignment,
  DbAssignmentSubmission, DbCertificate, DbNotification, DbPayment, DbAuditLog
} from './types';
import { UserRole, CourseStatus, CourseLevel, LessonType, QuestionType, SubmissionStatus, EnrollmentStatus } from '@edusphere/shared';

export class MemoryDataStore {
  private static instance: MemoryDataStore;

  public users: DbUser[] = [];
  public uploadedFiles: { id: string; userId: string; name: string; key: string; size: number; contentType: string }[] = [];
  public refreshTokens: { id: string; userId: string; token: string; expiresAt: string; isRevoked: boolean }[] = [];
  public categories: DbCategory[] = [];
  public courses: DbCourse[] = [];
  public topics: DbTopic[] = [];
  public lessons: DbLesson[] = [];
  public enrollments: DbEnrollment[] = [];
  public lessonProgress: DbLessonProgress[] = [];
  public assessments: DbAssessment[] = [];
  public assessmentAttempts: DbAssessmentAttempt[] = [];
  public assignments: DbAssignment[] = [];
  public assignmentSubmissions: DbAssignmentSubmission[] = [];
  public certificates: DbCertificate[] = [];
  public notifications: DbNotification[] = [];
  public payments: DbPayment[] = [];
  public auditLogs: DbAuditLog[] = [];
  public webhookEvents: { id: string; provider: string; eventId: string; processed: boolean; createdAt: string }[] = [];

  private isInitialized = false;

  private constructor() {
    this.seed();
  }

  public static getInstance(): MemoryDataStore {
    if (!MemoryDataStore.instance) {
      MemoryDataStore.instance = new MemoryDataStore();
    }
    return MemoryDataStore.instance;
  }

  // Preserve the existing domain services while persisting their complete state in PostgreSQL.
  public snapshot(): Record<string, unknown[]> {
    return Object.fromEntries(Object.entries(this).filter(([, value]) => Array.isArray(value)));
  }

  public restore(snapshot: Record<string, unknown[]>) {
    for (const key of Object.keys(this.snapshot())) {
      if (!Array.isArray(snapshot[key])) throw new Error(`Invalid stored collection: ${key}`);
      (this as any)[key] = snapshot[key];
    }
  }

  public reset() {
    this.uploadedFiles = [];
    this.users = [];
    this.refreshTokens = [];
    this.categories = [];
    this.courses = [];
    this.topics = [];
    this.lessons = [];
    this.enrollments = [];
    this.lessonProgress = [];
    this.assessments = [];
    this.assessmentAttempts = [];
    this.assignments = [];
    this.assignmentSubmissions = [];
    this.certificates = [];
    this.notifications = [];
    this.payments = [];
    this.auditLogs = [];
    this.webhookEvents = [];
    this.isInitialized = false;
    this.seed();
  }

  private seed() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const defaultPasswordHash = bcrypt.hashSync('EduSphere2026!', 10);
    const now = new Date().toISOString();

    // 1. Five Primary Demo Users
    const adminUser: DbUser = {
      id: 'usr-admin-001',
      email: 'admin@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'Eleanor',
      lastName: 'Vance',
      role: UserRole.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'EduSphere System Administrator & Academic Dean',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const instructorUser: DbUser = {
      id: 'usr-instructor-001',
      email: 'instructor@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'Dr. Marcus',
      lastName: 'Sterling',
      role: UserRole.INSTRUCTOR,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Senior Software Architect & EdTech Lead Instructor',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const authorUser: DbUser = {
      id: 'usr-author-001',
      email: 'author@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: UserRole.COURSE_AUTHOR,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: 'Curriculum Architect & Instructional Designer',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const assessorUser: DbUser = {
      id: 'usr-assessor-001',
      email: 'assessor@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'David',
      lastName: 'Kowalski',
      role: UserRole.ASSESSOR,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      bio: 'Technical Evaluator & Senior Grading Assessor',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const learnerUser: DbUser = {
      id: 'usr-learner-001',
      email: 'learner@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'Alex',
      lastName: 'Rivera',
      role: UserRole.LEARNER,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      bio: 'Enthusiastic Full Stack Development Student',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(adminUser, instructorUser, authorUser, assessorUser, learnerUser);

    // 20 Synthetic Learners
    for (let i = 1; i <= 20; i++) {
      const padId = String(i).padStart(3, '0');
      this.users.push({
        id: `usr-synthetic-${padId}`,
        email: `student${i}@edusphere.demo`,
        passwordHash: defaultPasswordHash,
        firstName: `Student${i}`,
        lastName: `Demo`,
        role: UserRole.LEARNER,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`,
        bio: `Synthetic learner ${i} for cohort analytics`,
        isActive: true,
        createdAt: new Date(Date.now() - (30 - i) * 86400000).toISOString(),
        updatedAt: now,
      });
    }

    // 2. Categories (5 required)
    const categories: DbCategory[] = [
      { id: 'cat-se', name: 'Software Engineering', slug: 'software-engineering', description: 'Full stack development, APIs, architectures and clean code', icon: 'Code', createdAt: now, updatedAt: now },
      { id: 'cat-data', name: 'Data & Analytics', slug: 'data-analytics', description: 'Data analysis, SQL databases, Python, pipelines and metrics', icon: 'BarChart2', createdAt: now, updatedAt: now },
      { id: 'cat-cloud', name: 'Cloud & DevOps', slug: 'cloud-devops', description: 'Docker, CI/CD, Kubernetes, AWS, infrastructure as code', icon: 'Cloud', createdAt: now, updatedAt: now },
      { id: 'cat-ux', name: 'UI/UX Design', slug: 'ui-ux-design', description: 'Design systems, prototyping, user research, Figma and accessibility', icon: 'Palette', createdAt: now, updatedAt: now },
      { id: 'cat-sec', name: 'Cybersecurity', slug: 'cybersecurity', description: 'Web security, ethical hacking, OWASP Top 10 and network defense', icon: 'Shield', createdAt: now, updatedAt: now },
    ];
    this.categories.push(...categories);

    // 3. 8 Professional Courses
    const coursesData = [
      {
        id: 'crs-python-001',
        title: 'Mastering Python: From Foundations to Microservices',
        slug: 'mastering-python-programming',
        subtitle: 'Build robust backend architectures, automation tools, and scalable REST APIs',
        description: 'Comprehensive, deep-dive Python curriculum designed for modern software engineers. Covers idioms, async IO, FastAPI microservices, and testing best practices.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
        categoryId: 'cat-se',
        level: CourseLevel.BEGINNER,
        price: 0.0,
        isPaid: false,
        status: CourseStatus.PUBLISHED,
        durationMinutes: 480,
        learningObjectives: ['Master idiomatic Python 3 syntax and data structures', 'Build async FastAPI microservices with Pydantic', 'Write robust test suites with pytest and HTTPX'],
        prerequisites: [],
      },
      {
        id: 'crs-fullstack-002',
        title: 'Full Stack Web Development with Next.js & Express',
        slug: 'full-stack-web-development',
        subtitle: 'Production-ready web development with TypeScript, React, Next.js, and Node.js',
        description: 'Architect and deploy enterprise-level web applications. Master React App Router, state management with TanStack Query, and Express REST APIs.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        categoryId: 'cat-se',
        level: CourseLevel.INTERMEDIATE,
        price: 49.99,
        isPaid: true,
        status: CourseStatus.PUBLISHED,
        durationMinutes: 620,
        learningObjectives: ['Build full-stack apps with Next.js App Router', 'Design secure REST APIs with Node.js and Express', 'Integrate relational databases with Prisma ORM'],
        prerequisites: ['crs-python-001'],
      },
      {
        id: 'crs-sql-003',
        title: 'SQL & Relational Database Engineering',
        slug: 'sql-database-management',
        subtitle: 'PostgreSQL schema design, indexing, transactions, and query optimization',
        description: 'Deep dive into relational database concepts, query optimization, indexing strategies, transactions, and data modeling for high-scale applications.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
        categoryId: 'cat-data',
        level: CourseLevel.INTERMEDIATE,
        price: 29.99,
        isPaid: true,
        status: CourseStatus.PUBLISHED,
        durationMinutes: 380,
        learningObjectives: ['Design normalized relational database schemas', 'Write complex SQL queries, CTEs, and window functions', 'Analyze query execution plans and optimize indexes'],
        prerequisites: [],
      },
      {
        id: 'crs-data-004',
        title: 'Modern Data Analytics & Cohort Modeling',
        slug: 'modern-data-analytics',
        subtitle: 'Derive actionable business intelligence and automated student progress metrics',
        description: 'Learn how to transform raw event logs into business intelligence, cohort retention curves, and heuristic indicators of customer churn.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
        categoryId: 'cat-data',
        level: CourseLevel.ADVANCED,
        price: 39.99,
        isPaid: true,
        status: CourseStatus.PUBLISHED,
        durationMinutes: 410,
        learningObjectives: ['Implement cohort performance calculations', 'Build transparent rule-based anomaly detection', 'Generate analytical reports and data visualizations'],
        prerequisites: ['crs-sql-003'],
      },
      {
        id: 'crs-devops-005',
        title: 'Cloud DevOps, Docker & Kubernetes Foundations',
        slug: 'cloud-computing-devops',
        subtitle: 'Containerize multi-service applications and automate continuous delivery',
        description: 'Industry-standard containerization, multi-stage Docker builds, private networking, reverse proxies, and automated GitHub Actions pipelines.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800',
        categoryId: 'cat-cloud',
        level: CourseLevel.INTERMEDIATE,
        price: 59.99,
        isPaid: true,
        status: CourseStatus.PUBLISHED,
        durationMinutes: 520,
        learningObjectives: ['Containerize full stack applications with Docker Compose', 'Configure reverse proxies and SSL certificates', 'Automate CI/CD pipelines with GitHub Actions'],
        prerequisites: ['crs-fullstack-002'],
      },
      {
        id: 'crs-uiux-006',
        title: 'Enterprise UI/UX Design & Design Systems',
        slug: 'ui-ux-design-systems',
        subtitle: 'Craft accessible, high-converting interfaces using Figma and design tokens',
        description: 'Learn how to construct cohesive design systems, micro-interactions, responsive grids, and accessible components conforming to WCAG 2.1 AA.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800',
        categoryId: 'cat-ux',
        level: CourseLevel.BEGINNER,
        price: 0.0,
        isPaid: false,
        status: CourseStatus.PUBLISHED,
        durationMinutes: 340,
        learningObjectives: ['Create cohesive design token palettes', 'Design accessible components with visible focus states', 'Prototype interactive micro-interactions and flows'],
        prerequisites: [],
      },
      {
        id: 'crs-sec-007',
        title: 'Web Application Security & Incident Defense',
        slug: 'web-application-security',
        subtitle: 'Protect modern web platforms against OWASP Top 10 vulnerabilities',
        description: 'Hands-on defense against SQL injection, XSS, broken access controls, privilege escalation, and token hijacking. Includes root-cause analysis simulations.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
        categoryId: 'cat-sec',
        level: CourseLevel.ADVANCED,
        price: 69.99,
        isPaid: true,
        status: CourseStatus.PUBLISHED,
        durationMinutes: 460,
        learningObjectives: ['Enforce server-side authorization boundaries', 'Prevent JWT tampering and token replay attacks', 'Conduct structured Root Cause Analysis for security incidents'],
        prerequisites: ['crs-fullstack-002'],
      },
      {
        id: 'crs-arch-008',
        title: 'Distributed Systems & Microservices Architecture',
        slug: 'distributed-systems-architecture',
        subtitle: 'Design resilient, event-driven backends with message brokers and outbox patterns',
        description: 'Architecting distributed systems with domain boundaries, transactional outboxes, idempotency, retry policies, and background job queues.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
        categoryId: 'cat-se',
        level: CourseLevel.ADVANCED,
        price: 79.99,
        isPaid: true,
        status: CourseStatus.PUBLISHED,
        durationMinutes: 580,
        learningObjectives: ['Decompose monoliths into bounded context microservices', 'Implement idempotent background workers with BullMQ', 'Design distributed caching and failover mechanisms'],
        prerequisites: ['crs-devops-005'],
      },
    ];

    coursesData.forEach(c => {
      this.courses.push({
        ...c,
        authorId: authorUser.id,
        instructorId: instructorUser.id,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
    });

    // 4. Create Topics, Lessons (30+ lessons across courses), Assessments and Assignments
    const sampleVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    ];

    let lessonCounter = 1;

    this.courses.forEach((course, cIdx) => {
      // 2 topics per course
      for (let t = 1; t <= 2; t++) {
        const topicId = `tpc-${course.id}-${t}`;
        this.topics.push({
          id: topicId,
          courseId: course.id,
          title: t === 1 ? 'Foundations & Architecture' : 'Advanced Implementation & Projects',
          description: `Detailed modules and exercises for ${course.title}`,
          orderIndex: t,
          createdAt: now,
          updatedAt: now,
        });

        // 2-3 lessons per topic (giving > 32 lessons total)
        const lessonCount = t === 1 ? 2 : 3;
        for (let l = 1; l <= lessonCount; l++) {
          const lessonId = `lsn-${course.id}-${t}-${l}`;
          const isVideo = l % 2 !== 0;
          this.lessons.push({
            id: lessonId,
            topicId: topicId,
            title: `Module ${t}.${l}: ${t === 1 ? 'Core Concepts and Standards' : 'Hands-On Engineering Practice'}`,
            slug: `lesson-${course.slug}-t${t}-l${l}`,
            description: `In this lesson, we explore the critical theoretical principles and production standards required for ${course.title}.`,
            type: isVideo ? LessonType.VIDEO : LessonType.TEXT,
            videoUrl: isVideo ? sampleVideos[(lessonCounter - 1) % sampleVideos.length] : undefined,
            contentText: !isVideo ? `# In-Depth Technical Guide\n\nWelcome to this comprehensive technical lesson. Here we review the architectural patterns, code contracts, and runtime considerations in detail.\n\n### Key Takeaways\n1. Always validate inputs at the API gateway boundary.\n2. Maintain deterministic business logic.\n3. Implement proper database transaction isolation levels.` : undefined,
            durationSeconds: isVideo ? 360 : 240,
            orderIndex: l,
            isPreview: t === 1 && l === 1,
            isMandatory: true,
            resources: [
              {
                id: `res-${lessonId}-1`,
                lessonId: lessonId,
                title: 'Lesson Cheat Sheet & Architecture Diagram (PDF)',
                fileUrl: `/api/v1/resources/${lessonId}`,
                fileType: 'application/pdf',
                fileSize: 1024 * 350,
                isDownloadable: true,
                createdAt: now,
              }
            ],
            createdAt: now,
            updatedAt: now,
          });
          lessonCounter++;
        }

        // Assessments (1 assessment per topic 1)
        if (t === 1) {
          const assessId = `asm-${course.id}`;
          const q1Id = `q-${assessId}-1`;
          const q2Id = `q-${assessId}-2`;
          const q3Id = `q-${assessId}-3`;

          this.assessments.push({
            id: assessId,
            courseId: course.id,
            topicId: topicId,
            title: `${course.title} Comprehensive Knowledge Check`,
            description: 'Evaluate your grasp of core principles, architectural boundaries, and syntax.',
            durationMinutes: 20,
            passingScore: 70.0,
            maxAttempts: 3,
            isStrictSequential: true,
            version: 1,
            questions: [
              {
                id: q1Id,
                assessmentId: assessId,
                prompt: 'Which layer is the authoritative system of record for business transactions?',
                type: QuestionType.SINGLE_CHOICE,
                points: 10.0,
                orderIndex: 1,
                options: [
                  { id: 'opt_a', text: 'Browser LocalStorage' },
                  { id: 'opt_b', text: 'Redis Cache' },
                  { id: 'opt_c', text: 'PostgreSQL Relational Database' },
                  { id: 'opt_d', text: 'Client React State' },
                ],
                correctAnswers: ['opt_c'],
                explanation: 'PostgreSQL provides ACID transactions and serves as the single system of record.',
              },
              {
                id: q2Id,
                assessmentId: assessId,
                prompt: 'Select all mechanisms that prevent unauthorized certificate generation:',
                type: QuestionType.MULTIPLE_CHOICE,
                points: 10.0,
                orderIndex: 2,
                options: [
                  { id: 'sec_a', text: 'Server-side verification of all mandatory lesson completions' },
                  { id: 'sec_b', text: 'Hiding the download button on the frontend' },
                  { id: 'sec_c', text: 'Server-side verification of passing grades on all required assessments' },
                  { id: 'sec_d', text: 'Cryptographic SHA-256 integrity hash verification' },
                ],
                correctAnswers: ['sec_a', 'sec_c', 'sec_d'],
                explanation: 'Hiding frontend buttons is never sufficient authorization; server-side rules and cryptographic hashing must be enforced.',
              },
              {
                id: q3Id,
                assessmentId: assessId,
                prompt: 'Learners can bypass sequential lesson locks by modifying browser localStorage or sending arbitrary API requests.',
                type: QuestionType.TRUE_FALSE,
                points: 10.0,
                orderIndex: 3,
                options: [
                  { id: 'true', text: 'True' },
                  { id: 'false', text: 'False' },
                ],
                correctAnswers: ['false'],
                explanation: 'Sequential lesson unlocks are validated server-side by checking completed prerequisites and previous mandatory lessons.',
              },
            ],
            createdAt: now,
            updatedAt: now,
          });
        }

        // Assignment for Topic 2
        if (t === 2) {
          const assignmentId = `asg-${course.id}`;
          this.assignments.push({
            id: assignmentId,
            courseId: course.id,
            topicId: topicId,
            title: `Capstone Implementation Project: ${course.title}`,
            instructions: 'Submit your complete solution source code (ZIP) or architectural design document (PDF). Ensure all functional requirements and test cases are satisfied.',
            maxScore: 100.0,
            deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
            allowedFileTypes: ['pdf', 'zip', 'docx'],
            maxFileSizeMb: 25,
            rubricCriteria: [
              { id: 'cr-arch', title: 'Architecture & System Design', description: 'Separation of concerns, clean interfaces, and maintainable structure', maxPoints: 30.0 },
              { id: 'cr-code', title: 'Code Quality & Formatting', description: 'Idiomatic patterns, strong typing, and zero lint warnings', maxPoints: 30.0 },
              { id: 'cr-test', title: 'Test Coverage & Correctness', description: 'Automated test suite passing with edge cases covered', maxPoints: 40.0 },
            ],
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    });

    // 5. Seed initial enrollment & completed progress for our demo learner in Course 1
    const learnerCourse1 = this.courses[0]; // Python course
    const enrollment1Id = `enr-${learnerUser.id}-${learnerCourse1.id}`;
    const enr1: DbEnrollment = {
      id: enrollment1Id,
      userId: learnerUser.id,
      courseId: learnerCourse1.id,
      status: EnrollmentStatus.COMPLETED,
      enrolledAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      progressPercentage: 100.0,
      lastAccessedAt: now,
    };
    this.enrollments.push(enr1);

    // Mark lessons in Course 1 as completed
    const c1Topics = this.topics.filter(t => t.courseId === learnerCourse1.id);
    const c1TopicIds = c1Topics.map(t => t.id);
    const c1Lessons = this.lessons.filter(l => c1TopicIds.includes(l.topicId));

    c1Lessons.forEach(l => {
      this.lessonProgress.push({
        id: `prog-${enr1.id}-${l.id}`,
        enrollmentId: enr1.id,
        lessonId: l.id,
        isCompleted: true,
        completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        lastPositionSeconds: l.durationSeconds,
        updatedAt: now,
      });
    });

    // Seed passed assessment attempt for Course 1
    const c1Assessment = this.assessments.find(a => a.courseId === learnerCourse1.id);
    if (c1Assessment) {
      this.assessmentAttempts.push({
        id: `atm-${c1Assessment.id}-${learnerUser.id}-1`,
        assessmentId: c1Assessment.id,
        userId: learnerUser.id,
        enrollmentId: enr1.id,
        attemptNumber: 1,
        startedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        submittedAt: new Date(Date.now() - 3 * 86400000 + 1200000).toISOString(),
        durationSeconds: 1200,
        score: 30.0,
        percentage: 100.0,
        isPassed: true,
        status: 'GRADED',
        answers: {
          [`q-${c1Assessment.id}-1`]: 'opt_c',
          [`q-${c1Assessment.id}-2`]: ['sec_a', 'sec_c', 'sec_d'],
          [`q-${c1Assessment.id}-3`]: 'false',
        },
        feedback: { summary: 'Outstanding demonstration of core principles.' },
        versionNumber: 1,
      });
    }

    // Seed graded assignment submission for Course 1
    const c1Assignment = this.assignments.find(a => a.courseId === learnerCourse1.id);
    if (c1Assignment) {
      this.assignmentSubmissions.push({
        id: `sub-${c1Assignment.id}-${learnerUser.id}`,
        assignmentId: c1Assignment.id,
        userId: learnerUser.id,
        enrollmentId: enr1.id,
        submissionText: 'https://github.com/edusphere/python-microservices-submission',
        fileUrl: '/storage/uploads/alex-python-capstone.zip',
        fileName: 'alex-python-capstone.zip',
        fileSize: 1024 * 1024 * 5,
        status: SubmissionStatus.GRADED,
        submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        score: 96.0,
        feedback: 'Exceptional architectural separation, clean API routes, and 100% test pass rate.',
        rubricScores: {
          'cr-arch': 29.0,
          'cr-code': 29.0,
          'cr-test': 38.0,
        },
        gradedById: assessorUser.id,
        gradedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      });
    }

    // Seed earned certificate for Course 1
    const certNum = 'EDU-2026-PYT-7892';
    this.certificates.push({
      id: `cert-${enr1.id}`,
      certificateNumber: certNum,
      userId: learnerUser.id,
      courseId: learnerCourse1.id,
      enrollmentId: enr1.id,
      issueDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      completionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
      verificationUrl: `${config.appUrl}/verify/${certNum}`,
      qrCodeData: `EDUSPHERE|CERT:${certNum}|VERIFY:${config.appUrl}/verify/${certNum}`,
      issuerName: 'EduSphere Academic Board & Dean Eleanor Vance',
      isRevoked: false,
      metadata: {
        learnerName: `${learnerUser.firstName} ${learnerUser.lastName}`,
        courseTitle: learnerCourse1.title,
        finalGradePercentage: 98.0,
        honors: 'Distinction',
      },
      createdAt: now,
    });

    // Seed in-progress enrollment for Course 2 (Full Stack)
    const learnerCourse2 = this.courses[1];
    const enr2: DbEnrollment = {
      id: `enr-${learnerUser.id}-${learnerCourse2.id}`,
      userId: learnerUser.id,
      courseId: learnerCourse2.id,
      status: EnrollmentStatus.ACTIVE,
      enrolledAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      progressPercentage: 40.0,
      lastAccessedAt: now,
    };
    this.enrollments.push(enr2);

    // Initial Notifications for learner
    this.notifications.push(
      {
        id: 'notif-1',
        userId: learnerUser.id,
        title: 'Certificate Awarded!',
        message: 'Congratulations! You have successfully completed Mastering Python and earned your verified certificate.',
        type: 'CERTIFICATE',
        isRead: false,
        linkUrl: `/dashboard/certificates`,
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'notif-2',
        userId: learnerUser.id,
        title: 'Assignment Graded',
        message: 'Assessor David Kowalski graded your Python Capstone project with a score of 96/100.',
        type: 'GRADE',
        isRead: true,
        linkUrl: `/dashboard/assignments`,
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
      {
        id: 'notif-3',
        userId: learnerUser.id,
        title: 'Upcoming Assessment Reminder',
        message: 'Knowledge Check for Full Stack Web Development is available.',
        type: 'ASSESSMENT',
        isRead: false,
        linkUrl: `/courses/${learnerCourse2.id}/learn`,
        createdAt: now,
      }
    );

    // Seed synthetic enrollments for cohort analytics in other courses
    for (let i = 1; i <= 20; i++) {
      const studentId = `usr-synthetic-${String(i).padStart(3, '0')}`;
      const progress = i % 4 === 0 ? 100 : (i % 3 === 0 ? 30 : 65);
      this.enrollments.push({
        id: `enr-${studentId}-${learnerCourse1.id}`,
        userId: studentId,
        courseId: learnerCourse1.id,
        status: progress === 100 ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
        enrolledAt: new Date(Date.now() - (25 - i) * 86400000).toISOString(),
        progressPercentage: progress,
        lastAccessedAt: new Date(Date.now() - (i % 5) * 86400000).toISOString(),
      });
    }

    console.log('✅ EduSphere database initialized with 5 demo roles, 20 synthetic learners, 8 professional courses, and curriculum hierarchy.');
  }
}
