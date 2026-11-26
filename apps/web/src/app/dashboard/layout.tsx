'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const path = usePathname();
  const allowed: Record<string, string[]> = { admin: ['ADMIN'], author: ['ADMIN','COURSE_AUTHOR','INSTRUCTOR'], instructor: ['ADMIN','INSTRUCTOR'], assessor: ['ADMIN','ASSESSOR','INSTRUCTOR'], learner: ['LEARNER'], certificates: ['LEARNER'], assignments: ['LEARNER'] };
  const section = path.split('/')[2];
  if (isLoading) return <p className="p-12 text-center">Loading dashboard…</p>;
  if (!user || (allowed[section] && !allowed[section].includes(user.role))) return <div className="p-12 text-center space-y-4"><h1 className="text-xl font-bold">Access restricted</h1><p>Select the appropriate demo role or sign in to continue.</p><Link className="text-indigo-600" href="/courses">Browse courses</Link></div>;
  return <>{children}</>;
}
