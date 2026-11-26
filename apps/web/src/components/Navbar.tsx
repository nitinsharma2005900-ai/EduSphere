'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { API_HOST_URL } from '@/lib/api';
import { useAuth, DEMO_USERS } from '@/context/AuthContext';
import { 
  BookOpen, ShieldCheck, GraduationCap, LayoutDashboard,
  UserCheck, ChevronDown, LogOut, CheckCircle2, Sparkles, ExternalLink
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, loginDemo, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/courses';
    switch (user.role) {
      case 'ADMIN': return '/dashboard/admin';
      case 'INSTRUCTOR': return '/dashboard/instructor';
      case 'COURSE_AUTHOR': return '/dashboard/author';
      case 'ASSESSOR': return '/dashboard/assessor';
      case 'LEARNER':
      default: return '/dashboard/learner';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all">
      {/* Top Demo Role Switcher Ribbon */}
      <div className="bg-navy-900 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between overflow-x-auto border-b border-navy-800">
        <div className="flex items-center gap-2 font-medium shrink-0">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-white font-semibold">Demo Role Switcher:</span>
          <span className="text-slate-400">Click to instantly explore persona:</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          {(Object.keys(DEMO_USERS) as Array<keyof typeof DEMO_USERS>).map(r => {
            const isCurrent = user?.role === r;
            return (
              <button
                key={r}
                onClick={() => loginDemo(r)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400 font-bold'
                    : 'bg-navy-800 text-slate-300 hover:bg-navy-700 hover:text-white'
                }`}
              >
                {r === 'COURSE_AUTHOR' ? 'Author' : r.charAt(0) + r.slice(1).toLowerCase()}
                {isCurrent && ' ✓'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-navy-900 via-indigo-900 to-violet-800 bg-clip-text text-transparent">
              EduSphere
            </span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-600 -mt-1">
              Enterprise LMS
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/courses" className="hover:text-indigo-600 transition-colors">
            Course Catalog
          </Link>
          <Link href={getDashboardLink()} className="hover:text-indigo-600 transition-colors flex items-center gap-1.5">
            <LayoutDashboard className="w-4 h-4 text-indigo-600" />
            Dashboard
          </Link>
          <Link href="/verify/EDU-2026-PYT-7892" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verify Certificate
          </Link>
          <a
            href={`${API_HOST_URL}/api/docs`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-indigo-600 transition-colors flex items-center gap-1 text-slate-500"
          >
            Swagger API
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </nav>

        {/* User Identity Menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white shadow-sm"
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt={user.firstName}
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                />
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{user.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-500">Signed in as</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                      Role: {user.role}
                    </span>
                  </div>
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                    My Role Dashboard
                  </Link>
                  <Link
                    href="/dashboard/learner"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    Learner Portal
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => loginDemo('LEARNER')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              Sign In (Demo)
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
