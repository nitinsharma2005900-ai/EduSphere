'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
export default function Assignments() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = async () => setItems(await apiRequest('/assignments', {}, token));
  useEffect(() => { if (token) load().catch(error => setMessage(error.message)); }, [token]);
  const submit = async (event: React.FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      let fileData = {};
      const file = form.get('file') as File;
      if (file?.size) {
        if (file.size > 10 * 1024 * 1024) throw new Error('Maximum upload size is 10 MB');
        const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
        fileData = await apiRequest('/files', { method: 'POST', body: JSON.stringify({ name: file.name, base64 }) }, token);
      }
      await apiRequest(`/assignments/${id}/submit`, { method: 'POST', body: JSON.stringify({ submissionText: form.get('text'), ...fileData }) }, token);
      await load(); setMessage('Assignment submitted for review.');
    } catch(error: any) { setMessage(error.message); }
    finally { setBusy(false); }
  };
  return <div className="max-w-4xl mx-auto p-8 space-y-6"><h1 className="text-2xl font-bold">My Assignments</h1>{message && <p role="status" className="p-4 rounded-xl bg-indigo-50">{message}</p>}{items.map(item => <article key={item.id} className="bg-white border rounded-2xl p-6 space-y-4"><div><h2 className="font-bold">{item.title}</h2><p className="text-sm text-slate-500 mt-1">{item.instructions}</p></div>{item.submission && <div className="bg-slate-50 p-4 rounded-xl text-sm"><p>Status: {item.submission.status}</p>{item.submission.score !== undefined && <p>Grade: {item.submission.score}/{item.maxScore}</p>}<p>{item.submission.feedback}</p></div>}<form onSubmit={event => submit(event, item.id)} className="space-y-3"><label className="block text-sm">Your response or project link<textarea name="text" aria-label={`Response for ${item.title}`} className="w-full border rounded-xl p-3 mt-1" rows={3} defaultValue={item.submission?.submissionText || ''} /></label><label className="block text-sm">Attach PDF, ZIP or DOCX (up to 10 MB)<input name="file" type="file" accept=".pdf,.zip,.docx" className="block mt-2 text-sm" /></label><button disabled={busy} className="bg-indigo-600 text-white px-5 py-2 rounded-xl disabled:opacity-50">{busy ? 'Submitting…' : 'Submit Assignment'}</button></form></article>)}</div>;
}
