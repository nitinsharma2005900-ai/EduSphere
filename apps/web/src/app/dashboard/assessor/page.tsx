'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { 
  FileCheck2, CheckCircle2, Clock, User, Award,
  ArrowRight, MessageSquare, ShieldCheck
} from 'lucide-react';

export default function AssessorDashboard() {
  const { user, token } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({
    'cr-arch': 28,
    'cr-code': 29,
    'cr-test': 38,
  });
  const [feedback, setFeedback] = useState('Excellent architectural boundaries, clean separation of concerns, and passing test suites.');
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    async function loadSubmissions() {
      if (!token) return;
      try {
        const data = await apiRequest('/assignments/asg-crs-python-001/submissions', {}, token);
        setSubmissions(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadSubmissions();
  }, [token]);

  const handleGrade = async () => {
    if (!selectedSub || !token) return;
    setGrading(true);
    try {
      const totalScore = Object.values(rubricScores).reduce((a, b) => a + b, 0);
      await apiRequest(`/submissions/${selectedSub.id}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          score: totalScore,
          feedback,
          rubricScores,
        }),
      }, token);

      alert(`Submission graded successfully! Awarded: ${totalScore}/100 pts`);
      setSelectedSub(null);

      // Refresh
      const data = await apiRequest('/assignments/asg-crs-python-001/submissions', {}, token);
      setSubmissions(data);
    } catch (err: any) {
      alert(err.message || 'Grading failed');
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Assessor & Grading Engine</span>
        <h1 className="text-2xl font-extrabold text-navy-900 mt-0.5">Capstone Submissions Queue</h1>
        <p className="text-xs text-slate-500">Review student code submissions and evaluate with standardized rubric criteria.</p>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900">Python Microservices Capstone Submissions</h2>
          <span className="text-[11px] text-slate-400">{submissions.length} Submissions</span>
        </div>

        <div className="divide-y divide-slate-100">
          {submissions.map((sub: any) => (
            <div key={sub.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-xs text-navy-900">{sub.studentName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sub.status === 'GRADED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">File: {sub.fileName || 'alex-python-capstone.zip'}</p>
                {sub.score !== undefined && (
                  <p className="text-xs font-semibold text-emerald-600">Grade: {sub.score}/100 pts</p>
                )}
              </div>

              <button
                onClick={() => setSelectedSub(sub)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                {sub.status === 'GRADED' ? 'Review / Re-Grade' : 'Evaluate Rubric'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rubric Grading Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Rubric-Based Evaluation</span>
              <h3 className="text-lg font-bold text-navy-900 mt-1">Grade Submission: {selectedSub.studentName}</h3>
            </div>

            {/* Rubric Criteria sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Architecture & System Design</span>
                  <span>{rubricScores['cr-arch']}/30 pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={rubricScores['cr-arch']}
                  onChange={e => setRubricScores({ ...rubricScores, 'cr-arch': Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Code Quality & Idioms</span>
                  <span>{rubricScores['cr-code']}/30 pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={rubricScores['cr-code']}
                  onChange={e => setRubricScores({ ...rubricScores, 'cr-code': Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Test Coverage & Correctness</span>
                  <span>{rubricScores['cr-test']}/40 pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={rubricScores['cr-test']}
                  onChange={e => setRubricScores({ ...rubricScores, 'cr-test': Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Written Feedback to Student</label>
              <textarea
                rows={3}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-sm font-extrabold text-navy-900">
                Total Score: {Object.values(rubricScores).reduce((a, b) => a + b, 0)}/100
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrade}
                  disabled={grading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                >
                  {grading ? 'Recording Grade...' : 'Save & Submit Grade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
