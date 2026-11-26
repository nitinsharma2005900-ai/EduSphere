'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, API_BASE_URL } from '@/lib/api';
import { 
  PlayCircle, Award, CheckCircle2, BookOpen, Clock,
  ArrowRight, ShieldCheck, Bell, ChevronRight, Download
} from 'lucide-react';

export default function LearnerDashboard() {
  const { user, token } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        setLoading(true);
        const [enr, certs] = await Promise.all([
          apiRequest('/enrollments/my', {}, token),
          apiRequest('/certificates/my', {}, token),
        ]);
        setEnrollments(enr);
        setCertificates(certs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const completedCourses = enrollments.filter(e => e.progressPercentage >= 100);
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((acc, e) => acc + e.progressPercentage, 0) / enrollments.length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-navy-900 via-indigo-950 to-navy-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Role: Learner Portfolio
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.firstName || 'Alex Rivera'}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Continue your curriculum progression, complete pending assessments, and earn cryptographic certificates.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 shrink-0">
            <div className="text-center px-2">
              <span className="text-2xl font-black text-indigo-400">{enrollments.length}</span>
              <span className="text-[10px] text-slate-300 block uppercase font-bold">Enrolled</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center px-2">
              <span className="text-2xl font-black text-emerald-400">{completedCourses.length}</span>
              <span className="text-[10px] text-slate-300 block uppercase font-bold">Completed</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="text-center px-2">
              <span className="text-2xl font-black text-amber-400">{certificates.length}</span>
              <span className="text-[10px] text-slate-300 block uppercase font-bold">Credentials</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Enrolled Courses & Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enrolled Courses (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900">Active Curricula</h2>
            <Link href="/courses" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Browse More <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {enrollments.map((enr: any) => (
              <div key={enr.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img src={enr.course?.thumbnailUrl} alt={enr.course?.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {enr.course?.level || 'Intermediate'}
                    </span>
                    <h3 className="text-sm font-bold text-navy-900 mt-0.5">{enr.course?.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${enr.progressPercentage}%` }}></div>
                      </div>
                      <span className="font-semibold text-slate-700">{enr.progressPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/courses/${enr.courseId}/learn`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    {enr.progressPercentage >= 100 ? 'Review Lessons' : 'Continue Learning'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates & Credentials (1 Col) */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-navy-900">Earned Certificates</h2>

          <div className="space-y-4">
            {certificates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-slate-400 text-xs">
                <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Complete 100% of lessons & quizzes in a course to unlock verified certificates.
              </div>
            ) : (
              certificates.map((cert: any) => (
                <div key={cert.id} className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-navy-900">{cert.courseTitle}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{cert.certificateNumber}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      VERIFIED
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      href={`/verify/${cert.certificateNumber}`}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      Public Verification Page <ChevronRight className="w-3 h-3" />
                    </Link>
                    <a
                      href={`${API_BASE_URL}/certificates/verify/${cert.certificateNumber}/pdf`}
                      download
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
