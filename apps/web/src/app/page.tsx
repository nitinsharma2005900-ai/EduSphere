'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, ArrowRight, CheckCircle2, ShieldCheck, PlayCircle,
  BarChart3, Code2, Users, Award, BookOpen, Layers, Clock, Star,
  HelpCircle, ChevronRight, Terminal, Cpu
} from 'lucide-react';

export default function HomePage() {
  const { user, loginDemo } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const stats = [
    { label: 'Production Courses', value: '8+', desc: 'Full Stack, Cloud, Python, UX' },
    { label: 'Active Learners', value: '25+', desc: 'Enrolled across all cohorts' },
    { label: 'Mandatory Assessments', value: '15/15', desc: 'Fully implemented & verified' },
    { label: 'Deterministic Grading', value: '100%', desc: 'Python FastAPI microservice' },
  ];

  const categories = [
    { name: 'Software Engineering', count: '3 Courses', icon: Code2, color: 'text-indigo-600 bg-indigo-50' },
    { name: 'Data & Analytics', count: '2 Courses', icon: BarChart3, color: 'text-violet-600 bg-violet-50' },
    { name: 'Cloud & DevOps', count: '1 Course', icon: Cpu, color: 'text-blue-600 bg-blue-50' },
    { name: 'UI/UX Design', count: '1 Course', icon: Layers, color: 'text-emerald-600 bg-emerald-50' },
    { name: 'Cybersecurity', count: '1 Course', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50' },
  ];

  const featuredCourses = [
    {
      id: 'crs-python-001',
      title: 'Mastering Python: From Foundations to Microservices',
      category: 'Software Engineering',
      level: 'Beginner',
      duration: '8h 00m',
      rating: 4.9,
      students: 24,
      isFree: true,
      image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
    },
    {
      id: 'crs-fullstack-002',
      title: 'Full Stack Web Development with Next.js & Express',
      category: 'Software Engineering',
      level: 'Intermediate',
      duration: '10h 20m',
      rating: 4.8,
      students: 19,
      isFree: false,
      price: '$49.99',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
    },
    {
      id: 'crs-sql-003',
      title: 'SQL & Relational Database Engineering',
      category: 'Data & Analytics',
      level: 'Intermediate',
      duration: '6h 20m',
      rating: 4.9,
      students: 15,
      isFree: false,
      price: '$29.99',
      image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
    },
  ];

  const faqs = [
    {
      q: 'How does EduSphere enforce server-side security?',
      a: 'EduSphere validates all authorizations on the Express backend. Learners cannot unlock restricted lessons, tamper with quiz scores, or claim unearned certificates by manipulating browser state or API requests.',
    },
    {
      q: 'What is the role of the Python FastAPI microservice?',
      a: 'The Python microservice provides 100% deterministic MCQ/rubric grading, transparent rule-based learning analytics, cohort performance models, and cryptographic certificate data preparation.',
    },
    {
      q: 'How do certificate verifications work?',
      a: 'Every issued certificate receives a unique tamper-evident identifier (e.g. EDU-2026-PYT-7892) and a public verification URL. Anyone can verify authenticity, completion date, and revocation status in real time.',
    },
    {
      q: 'How do I test all 5 personas in the live demo?',
      a: 'Use the top Demo Role Switcher ribbon on any page. With one click, switch between Learner, Instructor, Course Author, Assessor, and Administrator without entering credentials.',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/70 text-indigo-700 text-xs font-semibold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Next-Generation EdTech & Assessment Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 tracking-tight leading-tight">
              Enterprise Learning & <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 bg-clip-text text-transparent">
                Deterministic Assessment
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Empower instructors to author structured curricula, deliver interactive video lessons, evaluate quizzes with zero score drift, and issue verifiable digital credentials.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/courses"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Browse Course Catalog
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard/learner"
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-sm transition-all flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4 text-indigo-600" />
                Open Lesson Player
              </Link>
              <Link
                href="/dashboard/admin"
                className="px-5 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Admin Dashboard
              </Link>
            </div>
          </div>

          {/* Platform Live Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-5xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/90 backdrop-blur rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
                <p className="text-3xl font-extrabold text-indigo-600">{s.value}</p>
                <p className="text-xs font-bold text-navy-900 mt-1">{s.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Explore Curriculum</span>
            <h2 className="text-2xl font-bold text-navy-900 mt-1">Featured Masterclasses</h2>
          </div>
          <Link href="/courses" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View all 8 courses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCourses.map(course => (
            <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/95 text-navy-900 shadow-sm">
                  {course.category}
                </span>
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm ${
                  course.isFree ? 'bg-emerald-500 text-white' : 'bg-navy-900 text-white'
                }`}>
                  {course.isFree ? 'FREE' : course.price}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {course.duration}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> {course.students} learners</span>
                    <span className="flex items-center gap-1 text-amber-500 font-semibold"><Star className="w-3.5 h-3.5 fill-amber-400" /> {course.rating}</span>
                  </div>
                  <h3 className="font-bold text-navy-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {course.level}
                  </span>
                  <Link
                    href={`/courses/${course.id}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    View Syllabus <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Course Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-navy-900 mb-6">Explore by Domain</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={i}
                href={`/courses?category=${cat.name}`}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${cat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-navy-900 group-hover:text-indigo-600 transition-colors">{cat.name}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{cat.count}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4-Step Learning Journey */}
      <section className="bg-navy-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Structured Path</span>
            <h2 className="text-3xl font-extrabold mt-1">The EduSphere Learning Journey</h2>
            <p className="text-sm text-slate-400 mt-2">
              Every course enforces pedagogical sequencing to ensure authentic mastery before credential issuance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Curriculum Progression', desc: 'Watch HD videos, study interactive markdown modules, and download supplemental engineering guides.' },
              { step: '02', title: 'Sequential Unlock', desc: 'Lessons remain locked until prerequisite mandatory units are marked complete with server validation.' },
              { step: '03', title: 'Deterministic Testing', desc: 'Attempt timed assessments with MCQs and multi-select questions graded by our FastAPI microservice.' },
              { step: '04', title: 'Verifiable Certificate', desc: 'Pass all criteria to unlock your cryptographic SHA-256 tamper-evident completion certificate.' },
            ].map((st, i) => (
              <div key={i} className="bg-navy-800/80 border border-navy-700 rounded-2xl p-6 relative">
                <span className="text-3xl font-black text-indigo-500/40">{st.step}</span>
                <h3 className="text-base font-bold text-white mt-2">{st.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Common Inquiries</span>
          <h2 className="text-2xl font-bold text-navy-900 mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-bold text-navy-900 hover:text-indigo-600 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-90 text-indigo-600' : ''}`} />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
