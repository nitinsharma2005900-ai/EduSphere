'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import Link from 'next/link';

export default function CourseBuilder() {
  const { id } = useParams();
  const { token } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [kind, setKind] = useState('topics');
  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [video, setVideo] = useState('');
  const [options, setOptions] = useState('');
  const [correctIndex, setCorrectIndex] = useState(0);
  const load = async () => { const data = await apiRequest(`/author/courses/${id}`, {}, token); setCourse(data); setTopicId(previous => previous || data.topics[0]?.id || ''); };
  useEffect(() => { if (token) load().catch(error => setMessage(error.message)); }, [token, id]);
  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiRequest(`/author/courses/${id}/${kind}`, { method: 'POST', body: JSON.stringify({ title, topicId, type: video ? 'VIDEO' : 'TEXT', videoUrl: video || undefined, contentText: content || undefined, prompt: content, options: options.split('\n').filter(Boolean), correctIndex, instructions: content }) }, token);
      setTitle(''); setContent(''); setVideo(''); setOptions(''); setMessage('Content saved.'); await load();
    } catch (error: any) { setMessage(error.message); }
  };
  const publish = async () => {
    try { await apiRequest(`/courses/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'PUBLISHED' }) }, token); await load(); setMessage('Course published.'); }
    catch (error: any) { setMessage(error.message); }
  };
  const input = 'w-full rounded-xl border border-slate-200 p-3 text-sm bg-white';
  if (!course) return <p className="p-10 text-center">{message || 'Loading course…'}</p>;
  return <div className="max-w-5xl mx-auto p-8 space-y-6">
    <Link href="/dashboard/author" className="text-indigo-600 text-sm">← Curriculum studio</Link>
    <div className="flex justify-between gap-4"><div><h1 className="text-2xl font-bold">{course.title}</h1><p className="text-sm text-slate-500">{course.status} · Version {course.version}</p></div><button onClick={publish} className="rounded-xl bg-indigo-600 text-white px-5">Publish Course</button></div>
    {message && <p role="status" className="p-3 bg-indigo-50 rounded-xl">{message}</p>}
    <div className="grid md:grid-cols-2 gap-6"><section className="bg-white p-6 rounded-2xl border space-y-4"><h2 className="font-bold">Curriculum</h2>{course.topics.map((topic: any) => <div key={topic.id} className="border-b pb-4"><h3 className="font-semibold">{topic.title}</h3>{topic.lessons.map((lesson: any) => <p key={lesson.id} className="text-sm text-slate-500 mt-2">{lesson.type === 'VIDEO' ? '▶' : '▤'} {lesson.title}</p>)}{topic.assessments.map((item: any) => <p key={item.id} className="text-sm mt-2">Quiz: {item.title}</p>)}{topic.assignments.map((item: any) => <p key={item.id} className="text-sm mt-2">Assignment: {item.title}</p>)}</div>)}</section>
    <form onSubmit={add} className="bg-white p-6 rounded-2xl border space-y-4"><h2 className="font-bold">Add course content</h2><label className="block text-sm">Content type<select aria-label="Content type" className={input} value={kind} onChange={e => setKind(e.target.value)}><option value="topics">Module</option><option value="lessons">Lesson</option><option value="assessments">Quiz</option><option value="assignments">Assignment</option></select></label>
    {kind !== 'topics' && <label className="block text-sm">Module<select aria-label="Module" required className={input} value={topicId} onChange={e => setTopicId(e.target.value)}><option value="">Choose module</option>{course.topics.map((topic: any) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select></label>}
    <label className="block text-sm">Title<input aria-label="Title" required minLength={3} className={input} value={title} onChange={e => setTitle(e.target.value)} /></label>
    {kind !== 'topics' && <label className="block text-sm">{kind === 'assessments' ? 'Question' : kind === 'assignments' ? 'Instructions' : 'Lesson text'}<textarea required={!video} className={input} rows={5} value={content} onChange={e => setContent(e.target.value)} /></label>}
    {kind === 'lessons' && <label className="block text-sm">Video URL (optional)<input type="url" className={input} value={video} onChange={e => setVideo(e.target.value)} placeholder="https://…" /></label>}
    {kind === 'assessments' && <><label className="block text-sm">Answer options (one per line)<textarea required className={input} rows={4} value={options} onChange={e => setOptions(e.target.value)} /></label><label className="block text-sm">Correct option number<input type="number" min={1} max={10} className={input} value={correctIndex + 1} onChange={e => setCorrectIndex(Number(e.target.value) - 1)} /></label></>}
    <button className="bg-indigo-600 text-white rounded-xl px-5 py-3">Save Content</button></form></div></div>;
}
