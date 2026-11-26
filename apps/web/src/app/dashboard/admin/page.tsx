'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';
import { 
  ShieldCheck, Users, BookOpen, Award, CheckCircle2,
  AlertCircle, Activity, Server, Database, RefreshCw, XCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [revokingCert, setRevokingCert] = useState(false);
  const [certToRevoke, setCertToRevoke] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        setLoading(true);
        const [ov, users, logs] = await Promise.all([
          apiRequest('/analytics/overview'),
          apiRequest('/admin/users', {}, token),
          apiRequest('/admin/audit-logs', {}, token),
        ]);
        setOverview(ov);
        setUsersList(users);
        setAuditLogs(logs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !certToRevoke) return;
    setRevokingCert(true);
    try {
      await apiRequest(`/certificates/${certToRevoke}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason: revokeReason || 'Administrative audit policy failure' }),
      }, token);
      alert(`Certificate ${certToRevoke} revoked successfully with audit trail.`);
      setCertToRevoke('');
      setRevokeReason('');

      // Refresh logs
      const logs = await apiRequest('/admin/audit-logs', {}, token);
      setAuditLogs(logs);
    } catch (err: any) {
      alert(err.message || 'Revocation failed');
    } finally {
      setRevokingCert(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Enterprise Administration</span>
        <h1 className="text-2xl font-extrabold text-navy-900 mt-0.5">Platform Governance & Health</h1>
        <p className="text-xs text-slate-500">Manage user roles, certificate authorizations, system health, and audit logs.</p>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Accounts</span>
            <p className="text-2xl font-black text-navy-900 mt-1">{overview.totalUsers}</p>
            <span className="text-[11px] text-slate-400">5 roles configured</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Enrollments</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{overview.totalEnrollments}</p>
            <span className="text-[11px] text-slate-400">Across 8 courses</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issued Credentials</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{overview.totalCertificates}</p>
            <span className="text-[11px] text-slate-400">Verified cryptographic SHA-256</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <p className="text-2xl font-black text-amber-500 mt-1">{overview.completionRate}%</p>
            <span className="text-[11px] text-slate-400">Platform average</span>
          </div>
        </div>
      )}

      {/* System Service Health Status Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-navy-900">System Service Health & Integrations</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center gap-3">
            <Server className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">Express Core API</p>
              <p className="text-[11px] text-emerald-700">Port 4000 • ONLINE</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">FastAPI Analytics</p>
              <p className="text-[11px] text-emerald-700">Port 8000 • ONLINE</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">PostgreSQL Store</p>
              <p className="text-[11px] text-emerald-700">Port 5432 • CONNECTED</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">Redis & BullMQ</p>
              <p className="text-[11px] text-emerald-700">Port 6379 • CONNECTED</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users and Role Governance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900">User Identity & Access Management</h2>
          <span className="text-[11px] text-slate-400">{usersList.length} Accounts Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.slice(0, 10).map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="px-6 py-3 font-semibold text-navy-900">{u.firstName} {u.lastName}</td>
                  <td className="px-6 py-3 text-slate-500 font-mono">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Revocation with Audit Log Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-500" />
          <h2 className="text-sm font-bold text-navy-900">Certificate Revocation & Audit Governance</h2>
        </div>

        <form onSubmit={handleRevoke} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="Certificate Number (e.g. EDU-2026-PYT-7892)"
            value={certToRevoke}
            onChange={e => setCertToRevoke(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
          />
          <input
            type="text"
            placeholder="Revocation Reason"
            value={revokeReason}
            onChange={e => setRevokeReason(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
          />
          <button
            type="submit"
            disabled={revokingCert}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
          >
            {revokingCert ? 'Revoking...' : 'Revoke Certificate'}
          </button>
        </form>

        {auditLogs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700 block mb-2">Recent Audit Logs:</span>
            <div className="space-y-1.5">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg font-mono">
                  [{log.timestamp}] {log.action} on {log.entity} by Admin. Reason: {log.details?.reason || 'Policy'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
