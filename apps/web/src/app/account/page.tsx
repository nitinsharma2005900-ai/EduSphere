'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function AccountPage() {
  const { login, register, user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (mode === 'register') await register({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), password });
      else await login(email.trim(), password);
      router.push('/courses');
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in.'); }
    finally { setBusy(false); }
  }
  const inputClass = 'w-full border border-slate-300 rounded-xl p-3';
  return <main className="max-w-lg mx-auto p-6 sm:p-10">
    <section className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
      <h1 className="text-2xl font-bold">{mode === 'register' ? 'Create learner account' : 'Sign in to EduSphere'}</h1>
      <p className="text-sm text-slate-600">Use a synthetic test identity. Your registered name appears on certificates earned after completing course requirements.</p>
      {user && <p className="text-sm">Current account: {user.firstName} {user.lastName} ({user.email})</p>}
      <div className="flex gap-3"><button type="button" disabled={busy} onClick={() => {setMode('login');setError('');}} className="text-indigo-600">Sign in</button><button type="button" disabled={busy} onClick={() => {setMode('register');setError('');}} className="text-indigo-600">Register</button></div>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && <><label className="block">First name<input className={inputClass} required minLength={2} maxLength={80} autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} /></label><label className="block">Last name<input className={inputClass} required minLength={2} maxLength={80} autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} /></label></>}
        <label className="block">Email<input className={inputClass} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block">Password<input className={inputClass} type="password" required minLength={mode === 'register' ? 8 : 1} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} /></label>
        {mode === 'register' && <p className="text-xs text-slate-600">At least 8 characters, one uppercase letter, one number and one special character.</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-indigo-600 text-white p-3 disabled:opacity-50">{busy ? 'Submitting…' : mode === 'register' ? 'Create account' : 'Sign in'}</button>
      </form><Link href="/courses" className="text-sm text-indigo-600">Browse courses</Link>
    </section>
  </main>;
}
