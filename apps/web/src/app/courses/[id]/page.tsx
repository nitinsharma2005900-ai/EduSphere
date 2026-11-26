'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, API_BASE_URL } from '@/lib/api';
import { 
  PlayCircle, Clock, Award, ShieldCheck, CheckCircle2,
  Lock, BookOpen, User, Layers, ArrowRight, Calendar, ExternalLink
} from 'lucide-react';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const data = await apiRequest(`/courses/${params.id}`);
        setCourse(data);

        if (token) {
          const myEnr = await apiRequest('/enrollments/my', {}, token);
          const found = myEnr.some((e: any) => e.courseId === data.id);
          setIsEnrolled(found);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [params.id, token]);

  const handleEnroll = async () => {
    if (!token) {
      alert('Please sign in to enroll.');
      return;
    }
    setEnrolling(true);
    try {
      await apiRequest(`/enrollments/${course.id}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ paymentToken: 'tok_sandbox_approved' }),
      }, token);
      setIsEnrolled(true);
      router.push(`/courses/${course.id}/learn`);
    } catch (err: any) {
      alert(err.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  }

  if (!course) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 font-semibold">Course not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Banner */}
      <div className="bg-navy-900 rounded-3xl p-8 sm:p-10 text-white grid grid-cols-1 lg:grid-cols-3 gap-8 items-center shadow-xl">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {course.categoryName}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy-800 text-slate-300">
              Level: {course.level}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {course.title}
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            {course.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400" /> {Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60}m Total Content</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-emerald-400" /> Verifiable Certificate Included</span>
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-indigo-400" /> Instructor: {course.instructorName || 'Lead Architect'}</span>
          </div>
        </div>

        {/* Enrollment Card */}
        <div className="bg-white rounded-2xl p-6 text-slate-900 shadow-2xl border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="relative h-40 rounded-xl overflow-hidden mb-4 bg-slate-100">
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex items-baseline justify-between mb-4">
              <div>
                <span className="text-2xl font-black text-navy-900">
                  {!course.isPaid ? 'Free Enrollment' : `$${course.price}`}
                </span>
                <span className="text-xs text-slate-400 block">Sandbox Mock Payment</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600">
                Lifetime Access
              </span>
            </div>
          </div>

          {isEnrolled ? (
            <button
              onClick={() => router.push(`/courses/${course.id}/learn`)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Continue Learning
            </button>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              {enrolling ? 'Enrolling...' : 'Enroll in Course (Instant)'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <a
            href={`${API_BASE_URL}/integrations/calendar/${course.id}/ics`}
            download
            className="mt-3 text-[11px] text-slate-500 hover:text-indigo-600 text-center flex items-center justify-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            Export ICS Milestone Calendar
          </a>
        </div>
      </div>

      {/* Curriculum Outline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-navy-900">Course Curriculum & Syllabus</h2>
          <p className="text-xs text-slate-500 mt-1">Structured modules, interactive videos, knowledge checks, and capstone assignments.</p>
        </div>

        <div className="space-y-4">
          {course.topics?.map((topic: any, tIdx: number) => (
            <div key={topic.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50/80 px-5 py-3 font-semibold text-xs text-navy-900 flex items-center justify-between">
                <span>Topic {tIdx + 1}: {topic.title}</span>
                <span className="text-[11px] text-slate-500">{topic.lessons?.length || 0} Lessons</span>
              </div>
              <div className="divide-y divide-slate-100">
                {topic.lessons?.map((lesson: any, lIdx: number) => (
                  <div key={lesson.id} className="px-5 py-3 text-xs flex items-center justify-between hover:bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <PlayCircle className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-slate-800">{lesson.title}</span>
                      {lesson.isPreview && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600">Free Preview</span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px]">{Math.floor(lesson.durationSeconds / 60)} mins</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
