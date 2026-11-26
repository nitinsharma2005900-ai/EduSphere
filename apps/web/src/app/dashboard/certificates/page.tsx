'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
export default function Certificates() {
  const { token } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const load = async () => { const [certs, courses] = await Promise.all([apiRequest('/certificates/my', {}, token), apiRequest('/enrollments/my', {}, token)]); setCertificates(certs); setEnrollments(courses); };
  useEffect(() => { if (token) load().catch(error => setMessage(error.message)); }, [token]);
  const claim = async (id: string) => { try { await apiRequest(`/certificates/courses/${id}/claim`, { method: 'POST', body: '{}' }, token); await load(); setMessage('Certificate issued.'); } catch(error: any) { setMessage(error.message); } };
  return <div className="max-w-4xl mx-auto p-8 space-y-6"><h1 className="text-2xl font-bold">My Certificates</h1>{message && <p role="status" className="p-4 rounded-xl bg-indigo-50">{message}</p>}{certificates.map(cert => <article key={cert.id} className="bg-white border rounded-2xl p-6 space-y-3"><h2 className="font-bold">{cert.courseTitle}</h2><p className="text-sm text-slate-500">{cert.certificateNumber} · {cert.isRevoked ? 'Revoked' : 'Verified'}</p><div className="flex gap-6 text-sm text-indigo-600"><Link href={`/verify/${cert.certificateNumber}`}>Verify Certificate</Link>{!cert.isRevoked && <a href={`${API_BASE_URL}/certificates/verify/${cert.certificateNumber}/pdf`}>Download PDF</a>}</div></article>)}<h2 className="text-lg font-bold">Course eligibility</h2>{enrollments.map(enrollment => <article key={enrollment.id} className="bg-white rounded-xl border p-4 flex justify-between items-center"><div><p className="font-semibold">{enrollment.course?.title}</p><p className="text-sm text-slate-500">{enrollment.progressPercentage}% lessons complete</p></div>{!enrollment.hasCertificate && <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl" onClick={() => claim(enrollment.courseId)}>Claim Certificate</button>}</article>)}</div>;
}
