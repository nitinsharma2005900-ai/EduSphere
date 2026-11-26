'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, downloadFile } from '@/lib/api';
import Link from 'next/link';
import { 
  PlayCircle, CheckCircle2, Lock, FileText, Download,
  ArrowLeft, ArrowRight, ChevronRight, Award, HelpCircle, AlertCircle
} from 'lucide-react';

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [curriculum, setCurriculum] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadCurriculum() {
      if (!token) return;
      try {
        setLoading(true);
        const data = await apiRequest(`/enrollments/${params.id}/curriculum`, {}, token);
        setCurriculum(data);

        // Find first unlocked lesson
        for (const topic of data.topics) {
          const unlocked = topic.lessons.find((l: any) => !l.isLocked);
          if (unlocked) {
            setActiveLesson(unlocked);
            break;
          }
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCurriculum();
  }, [params.id, token]);

  const handleMarkComplete = async () => {
    if (!activeLesson || updating || !token) return;
    setUpdating(true);
    try {
      await apiRequest(`/enrollments/lessons/${activeLesson.id}/progress`, {
        method: 'POST',
        body: JSON.stringify({ isCompleted: true, positionSeconds: activeLesson.durationSeconds }),
      }, token);

      // Refresh curriculum
      const updated = await apiRequest(`/enrollments/${params.id}/curriculum`, {}, token);
      setCurriculum(updated);

      // Update active lesson state
      setActiveLesson((prev: any) => ({ ...prev, isCompleted: true }));
    } catch (err: any) {
      alert(err.message || 'Error updating lesson progress');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  }

  if (!curriculum) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-navy-900">Course Access Restricted</h2>
        <p className="text-xs text-slate-500">You must be enrolled to view this course curriculum.</p>
        <Link href={`/courses/${params.id}`} className="inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Go to Course Page
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <Link href={`/courses/${params.id}`} className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Course Progress:</span>
          <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${curriculum.course.progressPercentage}%` }}></div>
          </div>
          <span className="text-xs font-bold text-navy-900">{curriculum.course.progressPercentage}%</span>
          {curriculum.course.progressPercentage >= 100 && (
            <Link
              href="/dashboard/certificates"
              className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" /> Claim Certificate
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Video/Content Area + Curriculum Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Lesson Player */}
        <div className="lg:col-span-2 space-y-6">
          {activeLesson ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Functional Player */}
              {activeLesson.type === 'VIDEO' ? (
                <div className="relative aspect-video bg-navy-900 flex items-center justify-center">
                  {activeLesson.isLocked ? (
                    <div className="text-center text-white space-y-2 p-6">
                      <Lock className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="text-sm font-semibold">Lesson Locked</p>
                      <p className="text-xs text-slate-400">Complete previous mandatory lessons to unlock this video.</p>
                    </div>
                  ) : (
                    <video
                      controls
                      src={activeLesson.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="p-8 prose prose-slate max-w-none border-b border-slate-100">
                  <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold mb-3">
                    <FileText className="w-4 h-4" /> Text-Based Technical Lesson
                  </div>
                  <h2 className="text-xl font-bold text-navy-900">{activeLesson.title}</h2>
                  <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed mt-4">
                    {activeLesson.contentText || 'Detailed architectural reference materials.'}
                  </div>
                </div>
              )}

              {/* Lesson Controls & Description */}
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-lg font-bold text-navy-900">{activeLesson.title}</h1>
                    <p className="text-xs text-slate-500 mt-1">{activeLesson.description}</p>
                  </div>

                  <button
                    onClick={handleMarkComplete}
                    disabled={updating || activeLesson.isCompleted}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0 ${
                      activeLesson.isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {activeLesson.isCompleted ? 'Completed ✓' : updating ? 'Saving...' : 'Mark as Completed'}
                  </button>
                </div>

                {/* Downloadable Resources */}
                {activeLesson.resources && activeLesson.resources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700 block mb-2">Downloadable Resources:</span>
                    <div className="flex flex-wrap gap-2">
                      {activeLesson.resources.map((res: any) => (
                        <a
                          key={res.id}
                          href={res.fileUrl}
                          onClick={event => { event.preventDefault(); void downloadFile(res.fileUrl, token, 'lesson-notes.pdf').catch(error => alert(error.message)); }}
                          download
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          {res.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Select a lesson from the curriculum sidebar to begin.
            </div>
          )}
        </div>

        {/* Right Col: Curriculum & Assessments Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-navy-900 mb-4">Course Curriculum</h3>

            <div className="space-y-4">
              {curriculum.topics.map((topic: any, tIdx: number) => (
                <div key={topic.id} className="space-y-2">
                  <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    Topic {tIdx + 1}: {topic.title}
                  </p>

                  {/* Lessons */}
                  <div className="space-y-1">
                    {topic.lessons.map((lesson: any) => {
                      const isActive = activeLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          disabled={lesson.isLocked}
                          onClick={() => setActiveLesson(lesson)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                              : lesson.isLocked
                              ? 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {lesson.isCompleted ? (
                              <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-500'}`} />
                            ) : lesson.isLocked ? (
                              <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            ) : (
                              <PlayCircle className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                            )}
                            <span className="truncate">{lesson.title}</span>
                          </div>
                          <span className={`text-[10px] shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {Math.floor(lesson.durationSeconds / 60)}m
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Assessments inside topic */}
                  {topic.assessments && topic.assessments.length > 0 && (
                    <div className="pt-1">
                      {topic.assessments.map((assess: any) => (
                        <Link
                          key={assess.id}
                          href={`/courses/${params.id}/assessment/${assess.id}`}
                          className={`block px-3 py-2 rounded-xl text-xs border transition-all ${
                            assess.userPassed
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                              : 'bg-amber-50/60 border-amber-200 text-amber-900 hover:bg-amber-100/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5" />
                              {assess.title}
                            </span>
                            <span className="text-[10px] font-bold">
                              {assess.userPassed ? `Passed (${assess.userBestScore}%)` : `Take Quiz`}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
