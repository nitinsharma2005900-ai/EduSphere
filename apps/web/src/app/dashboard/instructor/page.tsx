'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { 
  Users, BarChart3, AlertTriangle, BookOpen, CheckCircle2,
  TrendingUp, Clock, ShieldAlert, Award, ArrowRight
} from 'lucide-react';

export default function InstructorDashboard() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('crs-python-001');
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        setLoading(true);
        const courseList = await apiRequest('/courses', {}, token);
        setCourses(courseList);

        if (selectedCourse) {
          const cohortData = await apiRequest(`/analytics/cohort/${selectedCourse}`, {}, token);
          setAnalytics(cohortData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token, selectedCourse]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Instructor & Analytics Portal</span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-0.5">Cohort Learning Intelligence</h1>
          <p className="text-xs text-slate-500">Monitor course completion, quiz pass rates, and transparent rule-based at-risk indicators.</p>
        </div>

        {/* Course Selector */}
        <select
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
          className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-navy-900 focus:outline-none focus:border-indigo-600 shadow-sm"
        >
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Top Metric Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
            <p className="text-2xl font-black text-navy-900 mt-1">{analytics.total_learners}</p>
            <span className="text-[11px] text-slate-400">Active cohort students</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{analytics.completion_rate}%</p>
            <span className="text-[11px] text-slate-400">Finished all mandatory units</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pass Rate</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{analytics.pass_rate}%</p>
            <span className="text-[11px] text-slate-400">Knowledge check average</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm bg-rose-50/30">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">At-Risk Learners</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{analytics.at_risk_count}</p>
            <span className="text-[11px] text-rose-500">Identified via transparent rules</span>
          </div>
        </div>
      )}

      {/* Transparent At-Risk Alert Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-navy-900">At-Risk Learners (Transparent Rule Evaluation)</h2>
          </div>
          <span className="text-[11px] text-slate-400">Rule-based heuristic model (FastAPI)</span>
        </div>

        <div className="divide-y divide-slate-100">
          {analytics?.at_risk_learners && analytics.at_risk_learners.length > 0 ? (
            analytics.at_risk_learners.map((learner: any) => (
              <div key={learner.user_id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-navy-900">{learner.user_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      learner.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {learner.risk_level} RISK ({learner.risk_score}%)
                    </span>
                  </div>
                  <ul className="text-xs text-slate-500 list-disc list-inside space-y-0.5">
                    {learner.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] text-indigo-600 font-semibold block mb-1">Recommended Intervention:</span>
                  <p className="text-xs font-medium text-slate-700 max-w-xs">{learner.recommended_action}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No learners currently meeting at-risk criteria in this course.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
