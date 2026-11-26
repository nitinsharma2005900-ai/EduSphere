'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';
export default function Notifications() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { if (token) apiRequest('/notifications', {}, token).then(setItems).catch(e => setError(e.message)); }, [token]);
  const read = async (id: string) => { try { await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }, token); setItems(items.map(n => n.id === id ? { ...n, isRead: true } : n)); } catch(e: any) { setError(e.message); } };
  return <div className="max-w-4xl mx-auto p-8 space-y-5"><h1 className="text-2xl font-bold">Notifications</h1>{error && <p role="alert">{error}</p>}{!items.length && <p>No notifications yet.</p>}{items.map(n => <article key={n.id} className={`rounded-2xl p-5 border ${n.isRead ? 'bg-white' : 'bg-indigo-50 border-indigo-200'}`}><h2 className="font-bold">{n.title}</h2><p className="text-sm text-slate-600 my-2">{n.message}</p><div className="flex gap-5 text-sm text-indigo-600">{n.linkUrl && <Link href={n.linkUrl}>View details</Link>}{!n.isRead && <button onClick={() => read(n.id)}>Mark as read</button>}</div></article>)}</div>;
}
