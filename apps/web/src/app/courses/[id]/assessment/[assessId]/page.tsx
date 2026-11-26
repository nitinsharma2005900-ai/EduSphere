'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { 
  HelpCircle, Clock, Award, CheckCircle2, XCircle,
  ArrowLeft, ArrowRight, RotateCcw, AlertTriangle
} from 'lucide-react';

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [assessment, setAssessment] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(20 * 60);

  useEffect(() => {
    async function loadAssessment() {
      if (!token) return;
      try {
        setLoading(true);
        const data = await apiRequest(`/assessments/${params.assessId}`, {}, token);
        setAssessment(data);
        setTimeLeft(data.durationMinutes * 60);
      } catch (err: any) {
        alert(err.message || 'Error loading assessment');
      } finally {
        setLoading(false);
      }
    }
    loadAssessment();
  }, [params.assessId, token]);

  // Timer countdown
  useEffect(() => {
    if (result || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [result, timeLeft]);

  const handleSelectOption = (questionId: string, optionId: string, isMulti: boolean) => {
    if (result) return; // Locked once submitted

    if (!isMulti) {
      setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    } else {
      const current = prevAnswers(questionId);
      const set = new Set(current);
      if (set.has(optionId)) {
        set.delete(optionId);
      } else {
        set.add(optionId);
      }
      setAnswers(prev => ({ ...prev, [questionId]: Array.from(set) }));
    }
  };

  const prevAnswers = (qid: string): string[] => {
    const val = answers[qid];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return [val];
    return [];
  };

  const handleSubmit = async () => {
    if (submitting || !token) return;
    setSubmitting(true);
    try {
      const graded = await apiRequest(`/assessments/${params.assessId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers }),
      }, token);
      setResult(graded);
    } catch (err: any) {
      alert(err.message || 'Grading failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  }

  if (!assessment) {
    return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500 font-semibold">Assessment not found</div>;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Link href={`/courses/${params.id}/learn`} className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Curriculum
        </Link>
        {!result && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-mono font-bold border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" />
            Time Remaining: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Assessment Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Deterministic Assessment Engine</span>
            <h1 className="text-xl font-bold text-navy-900 mt-1">{assessment.title}</h1>
            <p className="text-xs text-slate-500 mt-1">{assessment.description}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-slate-700 block">Passing Mark: {assessment.passingScore}%</span>
            <span className="text-[11px] text-slate-400">Max Attempts: {assessment.maxAttempts}</span>
          </div>
        </div>
      </div>

      {/* Result Score Banner */}
      {result && (
        <div className={`p-6 rounded-2xl border shadow-sm ${
          result.isPassed
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {result.isPassed ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-600" />
              )}
              <div>
                <h3 className="text-lg font-bold">
                  {result.isPassed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                </h3>
                <p className="text-xs opacity-80">
                  You scored {result.percentage}% (Required: {assessment.passingScore}%). Graded deterministically via Python microservice.
                </p>
              </div>
            </div>

            <Link
              href={`/courses/${params.id}/learn`}
              className="px-4 py-2 rounded-xl bg-navy-900 text-white text-xs font-bold shadow-sm"
            >
              Continue Course
            </Link>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {assessment.questions.map((q: any, qIdx: number) => {
          const isMulti = q.type === 'MULTIPLE_CHOICE';
          const selected = prevAnswers(q.id);
          const feedback = result?.feedback?.find((f: any) => f.question_id === q.id);

          return (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {qIdx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-navy-900">{q.prompt}</h3>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                  {q.points} Points ({q.type.replace('_', ' ')})
                </span>
              </div>

              {/* Options */}
              <div className="space-y-2 pt-2">
                {q.options.map((opt: any) => {
                  const isChecked = selected.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      disabled={Boolean(result)}
                      onClick={() => handleSelectOption(q.id, opt.id, isMulti)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs flex items-center justify-between border transition-all ${
                        isChecked
                          ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-${isMulti ? 'md' : 'full'} border flex items-center justify-center text-[10px] ${
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white font-bold' : 'border-slate-300'
                        }`}>
                          {isChecked && '✓'}
                        </div>
                        <span>{opt.text}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Breakdown after submission */}
              {feedback && (
                <div className={`p-3 rounded-xl text-xs mt-3 border ${
                  feedback.is_correct ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800' : 'bg-rose-50/60 border-rose-200 text-rose-800'
                }`}>
                  <p className="font-semibold">
                    {feedback.is_correct ? '✓ Correct (+ ' + feedback.points_awarded + ' pts)' : '✗ Incorrect (0 pts)'}
                  </p>
                  {feedback.explanation && (
                    <p className="mt-1 text-[11px] opacity-90">{feedback.explanation}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!result && (
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2"
          >
            {submitting ? 'Evaluating Submission...' : 'Submit Assessment for Deterministic Grading'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
