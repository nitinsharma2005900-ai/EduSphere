import React from 'react';
import Link from 'next/link';
import { API_HOST_URL, ANALYTICS_BASE_URL } from '@/lib/api';
import { GraduationCap, ShieldCheck, Github, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-900 text-slate-400 text-sm border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">EduSphere</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise Learning Management, Course Authoring & Deterministic Assessment Platform.
              Built with Next.js, Express, Python FastAPI, PostgreSQL, and Redis.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Core Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/courses" className="hover:text-white transition-colors">Course Catalog</Link></li>
              <li><Link href="/dashboard/learner" className="hover:text-white transition-colors">Learner Curriculum Player</Link></li>
              <li><Link href="/dashboard/author" className="hover:text-white transition-colors">Course Authoring Builder</Link></li>
              <li><Link href="/dashboard/assessor" className="hover:text-white transition-colors">Rubric Grading Engine</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Integrations & Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/verify/EDU-2026-PYT-7892" className="hover:text-white transition-colors flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Certificate Verification</Link></li>
              <li><a href={`${API_HOST_URL}/api/docs`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">Swagger REST Docs <ExternalLink className="w-3 h-3" /></a></li>
              <li><a href={`${ANALYTICS_BASE_URL}/docs`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">FastAPI Analytics Docs <ExternalLink className="w-3 h-3" /></a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Compliance & Security</h4>
            <p className="text-xs text-slate-400 mb-2">
              Server-side authorization enforced. JWT refresh rotation, tamper-proof SHA-256 certificates, and deterministic evaluation.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-800 text-emerald-400 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              All 15 Assessments Complete
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-navy-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 EduSphere Platform. Designed for Orion LMS Technical Cohort.</p>
          <p className="text-slate-400">Built with Next.js App Router, Express, FastAPI & PostgreSQL.</p>
        </div>
      </div>
    </footer>
  );
};
