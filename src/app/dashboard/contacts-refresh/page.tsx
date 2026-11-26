'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  HelpCircle,
  Clock,
  Filter,
} from 'lucide-react';

interface RefreshLog {
  _id: string;
  contactType: 'email' | 'phone';
  contactValue: string;
  previousStatus: string;
  newStatus: string;
  statusChanged: boolean;
  domain?: string;
  hasMx: boolean;
  mxRecords?: string[];
  syntaxValid: boolean;
  domainValid: boolean;
  mailboxExistenceUnknown: boolean;
  deliveryNotVerified: boolean;
  publicContactSourceAvailable: boolean;
  skippedFreshCheck: boolean;
  requiresHumanReview: boolean;
  failureReason?: string;
  evidenceSource: string;
  verificationMethod: string;
  refreshedAt: string;
  triggeredBy: string;
}

interface RefreshMetrics {
  totalLogs: number;
  mxFoundCount: number;
  invalidCount: number;
  reviewNeededCount: number;
  unknownMailboxCount: number;
  nextScheduledRunAt?: string | null;
}

export default function ContactRefreshPage() {
  const [metrics, setMetrics] = useState<RefreshMetrics>({
    totalLogs: 0,
    mxFoundCount: 0,
    invalidCount: 0,
    reviewNeededCount: 0,
    unknownMailboxCount: 0,
    nextScheduledRunAt: null,
  });
  const [logs, setLogs] = useState<RefreshLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMx, setFilterMx] = useState(false);
  const [filterReview, setFilterReview] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const summaryRes = await fetch('/api/contacts-refresh/summary');
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        if (json.data?.metrics) {
          setMetrics(json.data.metrics);
        }
      }

      let url = '/api/contacts-refresh/logs?limit=50';
      if (filterMx) url += '&hasMx=true';
      if (filterReview) url += '&requiresHumanReview=true';

      const listRes = await fetch(url);
      if (listRes.ok) {
        const json = await listRes.json();
        if (json.data?.logs) {
          setLogs(json.data.logs);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMx, filterReview]);

  const handleVerifyNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    try {
      setSubmitting(true);
      setActionMessage(null);
      const res = await fetch('/api/contacts-refresh/verify-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactValue: testEmail.trim(),
          contactType: 'email',
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setActionMessage(
          `Checked ${data.data.contactValue}: Status ${data.data.newStatus} | MX Records: ${data.data.hasMx ? 'Found' : 'None'} | Mailbox: Unknown (Deliverability not guaranteed from MX alone)`
        );
        setTestEmail('');
        fetchData();
      } else {
        setActionMessage(`Error: ${data.error?.message || 'Verification failed.'}`);
      }
    } catch {
      setActionMessage('Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-orange-500" />
              Contact Verification Refresh Engine
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Zero-cost RFC syntax validation, DNS MX resolution, and contact freshness audit. Never claims mailbox deliverability from MX records alone.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Contacts Audited</span>
              <Mail className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mt-2">{metrics.totalLogs}</div>
            <div className="text-[11px] text-slate-500 mt-1">Audit log records</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>MX Records Verified</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-2">{metrics.mxFoundCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Domain accepts mail</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Invalid Format / No MX</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-2">{metrics.invalidCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Unreachable domains</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Mailbox Status</span>
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-2">Unknown</div>
            <div className="text-[11px] text-slate-500 mt-1">Strict RFC zero-cost limitation</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Next Scheduled Run</span>
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-sm font-semibold text-white mt-3 truncate">
              {metrics.nextScheduledRunAt ? new Date(metrics.nextScheduledRunAt).toLocaleDateString() : 'Active Weekly'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Workspace schedule</div>
          </div>
        </div>

        {/* Real-Time Live Check Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Mail className="w-5 h-5 text-orange-500" />
            Instant Zero-Cost Contact Verification
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Runs RFC 5322 syntax evaluation and native Node.js DNS MX resolution with timeout guards.
          </p>
          <form onSubmit={handleVerifyNow} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. founder@boutiqueconsulting.com or +1 512 555 0199"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={submitting || !testEmail.trim()}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify Contact'}
            </button>
          </form>
          {actionMessage && (
            <div className="mt-3 p-3 bg-slate-800/80 border border-slate-700 text-xs text-slate-300 rounded-lg">
              {actionMessage}
            </div>
          )}
        </div>

        {/* History Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-500" />
              Contact Refresh History & Provenance
            </h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterMx}
                  onChange={(e) => setFilterMx(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-orange-600 focus:ring-0"
                />
                MX Found Only
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterReview}
                  onChange={(e) => setFilterReview(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-orange-600 focus:ring-0"
                />
                Requires Review
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Contact Value</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">DNS MX</th>
                  <th className="px-5 py-3.5">Mailbox State</th>
                  <th className="px-5 py-3.5">Refreshed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Loading verification records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No contact verification records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono text-white text-xs">
                        {log.contactValue}
                        {log.requiresHumanReview && (
                          <span className="block text-[10px] text-amber-400 mt-0.5">
                            • Review Required ({log.failureReason || 'Status changed'})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 capitalize text-xs">{log.contactType}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            log.newStatus === 'DOMAIN_MX_FOUND' || log.newStatus === 'VERIFIED'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                              : log.newStatus === 'INVALID_FORMAT' || log.newStatus === 'DOMAIN_NO_MX'
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {log.newStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {log.hasMx ? (
                          <span className="text-emerald-400 text-xs flex items-center gap-1 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Published
                          </span>
                        ) : (
                          <span className="text-rose-400 text-xs flex items-center gap-1 font-mono">
                            <XCircle className="w-3.5 h-3.5" /> None
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          Mailbox Unknown
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.refreshedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
