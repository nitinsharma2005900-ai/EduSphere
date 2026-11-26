import { MemoryDataStore } from '../database/store';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { CourseStatus, CourseLevel, UserRole } from '@edusphere/shared';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { requireCourseAccess } from './access';

const courseInput = z.object({
  title: z.string().trim().min(3).max(200), description: z.string().trim().min(3).max(20000),
  subtitle: z.string().max(300).optional(), thumbnailUrl: z.string().url().optional(),
  categoryId: z.string().optional(), level: z.nativeEnum(CourseLevel).optional(),
  price: z.number().min(0).max(100000).optional(), isPaid: z.boolean().optional(),
  durationMinutes: z.number().int().positive().optional(), learningObjectives: z.array(z.string()).max(50).optional(),
  prerequisites: z.array(z.string()).max(50).optional(), instructorId: z.string().optional(),
}).strict();

export class CourseService {
  private db = MemoryDataStore.getInstance();

  public async listCourses(query: {
    category?: string;
    level?: string;
    search?: string;
    status?: CourseStatus;
    page?: number;
    limit?: number;
  }) {
    let courses = [...this.db.courses];

    if (query.category) {
      courses = courses.filter(c => c.categoryId === query.category);
    }
    if (query.level) {
      courses = courses.filter(c => c.level === query.level);
    }
    if (query.status) {
      courses = courses.filter(c => c.status === query.status);
    } else {
      // Default to published for general public / learners
      courses = courses.filter(c => c.status === CourseStatus.PUBLISHED);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      courses = courses.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 12));
    const total = courses.length;
    const startIndex = (page - 1) * limit;
    const paginated = courses.slice(startIndex, startIndex + limit);

    const enriched = paginated.map(c => {
      const category = this.db.categories.find(cat => cat.id === c.categoryId);
      const author = this.db.users.find(u => u.id === c.authorId);
      const instructor = this.db.users.find(u => u.id === c.instructorId);
      const enrolledCount = this.db.enrollments.filter(e => e.courseId === c.id).length;

      return {
        ...c,
        categoryName: category?.name,
        authorName: author ? `${author.firstName} ${author.lastName}` : undefined,
        instructorName: instructor ? `${instructor.firstName} ${instructor.lastName}` : undefined,
        enrolledCount,
        rating: 4.8,
      };
    });

    return {
      courses: enriched,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public async getCourseById(id: string) {
    const course = this.db.courses.find(c => c.id === id || c.slug === id);
    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new NotFoundError('Course not found');
    }

    const category = this.db.categories.find(cat => cat.id === course.categoryId);
    const author = this.db.users.find(u => u.id === course.authorId);
    const instructor = this.db.users.find(u => u.id === course.instructorId);
    const enrolledCount = this.db.enrollments.filter(e => e.courseId === course.id).length;

    // Topics & lesson previews
    const topics = this.db.topics
      .filter(t => t.courseId === course.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(t => {
        const lessons = this.db.lessons
          .filter(l => l.topicId === t.id)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map(l => ({
            id: l.id,
            topicId: l.topicId,
            title: l.title,
            slug: l.slug,
            durationSeconds: l.durationSeconds,
            orderIndex: l.orderIndex,
            type: l.type,
            isPreview: l.isPreview,
            isMandatory: l.isMandatory,
          }));

        const assessments = this.db.assessments
          .filter(a => a.topicId === t.id)
          .map(a => ({
            id: a.id,
            title: a.title,
            durationMinutes: a.durationMinutes,
            passingScore: a.passingScore,
            maxAttempts: a.maxAttempts,
          }));

        const assignments = this.db.assignments
          .filter(asg => asg.topicId === t.id)
          .map(asg => ({
            id: asg.id,
            title: asg.title,
            maxScore: asg.maxScore,
            deadline: asg.deadline,
          }));

        return {
          ...t,
          lessons,
          assessments,
          assignments,
        };
      });

    return {
      ...course,
      categoryName: category?.name,
      authorName: author ? `${author.firstName} ${author.lastName}` : undefined,
      instructorName: instructor ? `${instructor.firstName} ${instructor.lastName}` : undefined,
      enrolledCount,
      topics,
    };
  }

  public async createCourse(data: any, userId: string, userRole: UserRole) {
    data = courseInput.parse(data);
    if (userRole !== UserRole.COURSE_AUTHOR && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only course authors or administrators can create courses');
    }

    const now = new Date().toISOString();
    const courseId = `crs-${uuidv4().substring(0, 8)}`;
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newCourse: any = {
      id: courseId,
      title: data.title,
      slug: `${slug}-${uuidv4().substring(0, 4)}`,
      subtitle: data.subtitle || '',
      description: data.description,
      thumbnailUrl: data.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      categoryId: data.categoryId || this.db.categories[0].id,
      level: data.level || CourseLevel.BEGINNER,
      price: data.isPaid ? Number(data.price) || 29.99 : 0.0,
      isPaid: Boolean(data.isPaid),
      status: CourseStatus.DRAFT,
      durationMinutes: Number(data.durationMinutes) || 120,
      learningObjectives: data.learningObjectives || ['Master the fundamental principles'],
      prerequisites: data.prerequisites || [],
      authorId: userId,
      instructorId: data.instructorId || userId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.db.courses.push(newCourse);
    return newCourse;
  }

  public async updateCourse(courseId: string, data: any, userId: string, userRole: UserRole) {
    data = courseInput.partial().parse(data);
    const course = this.db.courses.find(c => c.id === courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (userRole !== UserRole.ADMIN && course.authorId !== userId) {
      throw new ForbiddenError('Only the course author or administrator can edit this course');
    }

    Object.assign(course, {
      ...data,
      version: course.version + 1,
      updatedAt: new Date().toISOString(),
    });

    return course;
  }

  public async updateCourseStatus(courseId: string, status: CourseStatus, userRole: UserRole, userId: string) {
    z.nativeEnum(CourseStatus).parse(status);
    requireCourseAccess(courseId, userId, true);
    const course = this.db.courses.find(c => c.id === courseId);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (![UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.COURSE_AUTHOR].includes(userRole)) {
      throw new ForbiddenError('Only administrators or instructors can publish or archive courses');
    }

    course.status = status;
    course.updatedAt = new Date().toISOString();
    return course;
  }
}
