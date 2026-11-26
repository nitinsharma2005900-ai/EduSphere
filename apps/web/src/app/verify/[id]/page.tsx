'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiRequest, API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
import { 
  ShieldCheck, CheckCircle2, XCircle, Award, Calendar,
  User, BookOpen, ExternalLink, ArrowLeft
} from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        const data = await apiRequest(`/certificates/verify/${encodeURIComponent(String(params.id))}`);
        setCert(data);
      } catch (err: any) {
        setCert({ error: err.message || 'Invalid certificate' });
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  const isInvalid = !cert || cert.error || cert.isRevoked || !cert.isValid;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
      <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Return to EduSphere
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-8 text-center relative overflow-hidden">
        {/* Verification Status Badge */}
        {!isInvalid ? (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                OFFICIALLY VERIFIED & VALID
              </span>
              <h1 className="text-2xl font-black text-navy-900 mt-3">Verified Academic Credential</h1>
              <p className="text-xs text-slate-500 mt-1">
                Issued by EduSphere Academic Board & verified against the PostgreSQL system of record.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm ring-8 ring-rose-50/50">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                {cert?.isRevoked ? 'CERTIFICATE REVOKED' : 'INVALID CERTIFICATE'}
              </span>
              <h1 className="text-2xl font-black text-navy-900 mt-3">Verification Failed</h1>
              <p className="text-xs text-rose-600 mt-1">
                {cert?.revocationReason ? `Revocation Reason: ${cert.revocationReason}` : 'No authentic record exists for this identifier.'}
              </p>
            </div>
          </div>
        )}

        {/* Certificate Details */}
        {!isInvalid && (
          <div className="bg-slate-50 rounded-2xl p-6 text-left border border-slate-100 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Learner Name</span>
                <span className="font-bold text-navy-900 text-sm">{cert.learnerName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Certificate Number</span>
                <span className="font-bold text-indigo-600 font-mono text-xs">{cert.certificateNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Course Title</span>
                <span className="font-bold text-navy-900 text-xs">{cert.courseTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block">Issue Date</span>
                <span className="font-bold text-navy-900 text-xs">{new Date(cert.issueDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Authority: {cert.issuerName}</span>
              <span className="font-mono text-emerald-600 font-semibold">Record verified</span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-wrap gap-3 justify-center">{!isInvalid && <a className="text-indigo-600 text-sm" href={`${API_BASE_URL}/certificates/verify/${encodeURIComponent(cert.certificateNumber)}/pdf`}>Download PDF</a>}<Link className="text-indigo-600 text-sm" href="/verify">Verify another certificate</Link>
          <Link
            href="/courses"
            className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
          >
            Explore EduSphere Curricula
          </Link>
        </div>
      </div>
    </div>
  );
}
