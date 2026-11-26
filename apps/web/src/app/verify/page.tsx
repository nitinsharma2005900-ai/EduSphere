'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
export default function VerifyLookup() {
  const [number,setNumber] = useState('');
  const router = useRouter();
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (number.trim()) router.push('/verify/' + encodeURIComponent(number.trim())); }
  return <section className="max-w-lg mx-auto p-8"><h1 className="text-2xl font-bold mb-4">Verify a certificate</h1><form onSubmit={submit} className="space-y-4"><label className="block">Certificate number<input required className="w-full border rounded-xl p-3" value={number} onChange={e => setNumber(e.target.value)} placeholder="EDU-2026-…" /></label><button className="bg-indigo-600 rounded-xl p-3 text-white">Verify Certificate</button></form></section>;
}
