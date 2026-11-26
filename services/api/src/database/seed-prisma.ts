import { PrismaClient, Role, CourseLevel, CourseStatus, LessonType, QuestionType, EnrollmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma PostgreSQL Database Seeding...');
  const defaultPasswordHash = bcrypt.hashSync('EduSphere2026!', 10);

  // 1. Seed Demo Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@edusphere.demo' },
    update: {},
    create: {
      id: 'usr-admin-001',
      email: 'admin@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'Eleanor',
      lastName: 'Vance',
      role: Role.ADMIN,
      bio: 'EduSphere System Administrator & Academic Dean',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@edusphere.demo' },
    update: {},
    create: {
      id: 'usr-instructor-001',
      email: 'instructor@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'Dr. Marcus',
      lastName: 'Sterling',
      role: Role.INSTRUCTOR,
      bio: 'Senior Software Architect & EdTech Lead Instructor',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const author = await prisma.user.upsert({
    where: { email: 'author@edusphere.demo' },
    update: {},
    create: {
      id: 'usr-author-001',
      email: 'author@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'Sarah',
      lastName: 'Chen',
      role: Role.COURSE_AUTHOR,
      bio: 'Curriculum Architect & Instructional Designer',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const assessor = await prisma.user.upsert({
    where: { email: 'assessor@edusphere.demo' },
    update: {},
    create: {
      id: 'usr-assessor-001',
      email: 'assessor@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'David',
      lastName: 'Kowalski',
      role: Role.ASSESSOR,
      bio: 'Technical Evaluator & Senior Grading Assessor',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const learner = await prisma.user.upsert({
    where: { email: 'learner@edusphere.demo' },
    update: {},
    create: {
      id: 'usr-learner-001',
      email: 'learner@edusphere.demo',
      passwordHash: defaultPasswordHash,
      firstName: 'Alex',
      lastName: 'Rivera',
      role: Role.LEARNER,
      bio: 'Enthusiastic Full Stack Development Student',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
  });

  console.log('✅ Demo users seeded successfully.');

  // 2. Categories
  const catSe = await prisma.category.upsert({
    where: { slug: 'software-engineering' },
    update: {},
    create: {
      id: 'cat-se',
      name: 'Software Engineering',
      slug: 'software-engineering',
      description: 'Full stack development, APIs, architectures and clean code',
      icon: 'Code',
    },
  });

  const catData = await prisma.category.upsert({
    where: { slug: 'data-analytics' },
    update: {},
    create: {
      id: 'cat-data',
      name: 'Data & Analytics',
      slug: 'data-analytics',
      description: 'Data analysis, SQL databases, Python, pipelines and metrics',
      icon: 'BarChart2',
    },
  });

  // 3. Primary Courses
  const course1 = await prisma.course.upsert({
    where: { slug: 'mastering-python-programming' },
    update: {},
    create: {
      id: 'crs-python-001',
      title: 'Mastering Python: From Foundations to Microservices',
      slug: 'mastering-python-programming',
      subtitle: 'Build robust backend architectures, automation tools, and scalable REST APIs',
      description: 'Comprehensive, deep-dive Python curriculum designed for modern software engineers. Covers idioms, async IO, FastAPI microservices, and testing best practices.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      categoryId: catSe.id,
      level: CourseLevel.BEGINNER,
      price: 0.0,
      isPaid: false,
      status: CourseStatus.PUBLISHED,
      durationMinutes: 480,
      learningObjectives: ['Master idiomatic Python 3 syntax and data structures', 'Build async FastAPI microservices with Pydantic', 'Write robust test suites with pytest and HTTPX'],
      authorId: author.id,
      instructorId: instructor.id,
      version: 1,
    },
  });

  console.log('✅ PostgreSQL seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
