'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest, API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
export default function Certificates() {
  const { token, user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const load = async () => { const [certs, courses] = await Promise.all([apiRequest('/certificates/my', {}, token), apiRequest('/enrollments/my', {}, token)]); setCertificates(certs); setEnrollments(courses); };
  useEffect(() => {
    let active = true;
    setCertificates([]); setEnrollments([]); setMessage('');
    if (token) Promise.all([apiRequest('/certificates/my', {}, token), apiRequest('/enrollments/my', {}, token)]).then(([certs, courses]) => { if (active) { setCertificates(certs); setEnrollments(courses); } }).catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [token, user?.id]);
  const claim = async (id: string) => { try { await apiRequest(`/certificates/courses/${id}/claim`, { method: 'POST', body: '{}' }, token); await load(); setMessage('Certificate issued.'); } catch(error: any) { setMessage(error.message); } };
  const download = async (cert: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/certificates/verify/${encodeURIComponent(cert.certificateNumber)}/pdf`);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || `Certificate download failed (HTTP ${response.status}).`);
      }
      if (!response.headers.get('content-type')?.includes('application/pdf')) throw new Error('The server did not return a PDF.');
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      const disposition = response.headers.get('content-disposition') || '';
      const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const plainName = disposition.match(/filename="([^"]+)"/i);
      let filename = plainName?.[1] || `${cert.certificateNumber.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`;
      if (encodedName) { try { filename = decodeURIComponent(encodedName[1]); } catch {} }
      link.download = filename.replace(/[\\/]/g, '_');
      link.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'PDF download failed.'); }
  };
  return <div className="max-w-4xl mx-auto p-8 space-y-6"><h1 className="text-2xl font-bold">My Certificates</h1><p className="text-slate-600">{user?.firstName} {user?.lastName}</p>{message && <p role="status" className="p-4 rounded-xl bg-indigo-50">{message}</p>}{certificates.map(cert => <article key={cert.id} className="bg-white border rounded-2xl p-6 space-y-3"><h2 className="font-bold">{cert.courseTitle}</h2><p className="text-sm">Issued to: {cert.learnerName}</p><p className="text-sm text-slate-500">{cert.certificateNumber} · {cert.isRevoked ? 'Revoked' : 'Verified'}</p><div className="flex gap-6 text-sm text-indigo-600"><Link href={`/verify/${encodeURIComponent(cert.certificateNumber)}`}>Verify Certificate</Link>{!cert.isRevoked && <button type="button" onClick={() => download(cert)}>Download PDF</button>}</div></article>)}<h2 className="text-lg font-bold">Course eligibility</h2>{enrollments.map(enrollment => <article key={enrollment.id} className="bg-white rounded-xl border p-4 flex justify-between items-center"><div><p className="font-semibold">{enrollment.course?.title}</p><p className="text-sm text-slate-500">{enrollment.progressPercentage}% lessons complete</p></div>{!enrollment.hasCertificate && <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl" onClick={() => claim(enrollment.courseId)}>Claim Certificate</button>}</article>)}</div>;
}
