'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/components/AuthContext';
import {
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';

interface MonitoringSummary {
  totalMonitored: number;
  availableCount: number;
  downCount: number;
  sslExpiringCount: number;
  averageLatencyMs: number;
  schedule?: {
    id: string;
    enabled: boolean;
    frequency: string;
    nextRunAt: string;
    lastRunAt?: string;
    lastRunStatus?: string;
  } | null;
}

interface SnapshotItem {
  id: string;
  targetUrl: string;
  normalizedDomain: string;
  monitoredAt: string;
  status: string;
  checkResults: {
    isAvailable: boolean;
    httpStatus?: number;
    responseTimeMs?: number;
    sslValid?: boolean;
    sslExpiryDaysRemaining?: number;
    redirectCount: number;
    finalUrl: string;
    title?: string;
    errorMessage?: string;
  };
  changeSummary?: {
    statusChanged: boolean;
    sslApproachingExpiry: boolean;
    changeDetails: string[];
  };
}

export default function MonitoringDashboardPage() {
  const { activeWorkspace, csrfToken } = useAuth();
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingUrl, setCheckingUrl] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchMonitoringData = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const [sumRes, snapRes] = await Promise.all([
        fetch(`${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/monitoring/summary`, {
          credentials: 'include',
        }),
        fetch(`${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/monitoring/snapshots?limit=30`, {
          credentials: 'include',
        }),
      ]);

      if (sumRes.ok) {
        const data = await sumRes.json();
        setSummary(data.data);
      }
      if (snapRes.ok) {
        const data = await snapRes.json();
        setSnapshots(data.data.snapshots || []);
      }
    } catch {
      setFeedback('Error loading website monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMonitoringData();
  }, [activeWorkspace]);

  const handleCheckNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkingUrl || !activeWorkspace) return;
    try {
      setCheckLoading(true);
      setFeedback(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const res = await fetch(`${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/monitoring/check-now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify({ targetUrl: checkingUrl }),
      });

      if (res.ok) {
        setFeedback(`Monitoring check completed for ${checkingUrl}`);
        setCheckingUrl('');
        await fetchMonitoringData();
      } else {
        const err = await res.json();
        setFeedback(err.error?.message || 'Failed to execute monitoring check');
      }
    } catch {
      setFeedback('Failed to reach monitoring API endpoint');
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe className="w-7 h-7 text-orange-500" />
              Recurring Website Monitoring
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Autonomous HTTP availability, SSL certificate expiry, response latency, and change detection.
            </p>
          </div>
          <button
            onClick={() => void fetchMonitoringData()}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {feedback && (
          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-orange-400">
            {feedback}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Monitored</span>
              <Globe className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-white">{summary?.totalMonitored ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Unique websites tracked</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Available Online</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{summary?.availableCount ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Passing HTTP availability</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Down / Failed</span>
              <XCircle className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{summary?.downCount ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Unreachable or HTTP 4xx/5xx</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">SSL Expiring Soon</span>
              <ShieldCheck className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-400">{summary?.sslExpiringCount ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">&le; 14 days certificate validity</div>
          </div>
        </div>

        {/* Quick Check Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">On-Demand Safe Website Audit</h2>
          <form onSubmit={handleCheckNow} className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. https://example.com"
              value={checkingUrl}
              onChange={(e) => setCheckingUrl(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={checkLoading || !checkingUrl}
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              {checkLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Audit Now
            </button>
          </form>
        </div>

        {/* Snapshots Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-base font-semibold text-white">Recent Monitoring Snapshots</h2>
            <span className="text-xs text-slate-400">Total: {snapshots.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Website</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Response Time</th>
                  <th className="py-3 px-4">SSL Validity</th>
                  <th className="py-3 px-4">Detected Changes</th>
                  <th className="py-3 px-4">Monitored At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {snapshots.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No website monitoring snapshots recorded yet.
                    </td>
                  </tr>
                ) : (
                  snapshots.map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium text-white flex items-center gap-1.5">
                          {snap.normalizedDomain}
                          <a
                            href={snap.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-orange-400"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {snap.checkResults.title && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{snap.checkResults.title}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {snap.checkResults.isAvailable ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {snap.checkResults.httpStatus || 200} OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-800">
                            <XCircle className="w-3 h-3" />
                            {snap.checkResults.httpStatus ? `HTTP ${snap.checkResults.httpStatus}` : 'DOWN'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {snap.checkResults.responseTimeMs ? `${snap.checkResults.responseTimeMs} ms` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {snap.checkResults.sslValid ? (
                          <span className="text-xs text-slate-300 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            {snap.checkResults.sslExpiryDaysRemaining !== undefined
                              ? `${snap.checkResults.sslExpiryDaysRemaining} days remaining`
                              : 'Valid SSL'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                            No SSL / Invalid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {snap.changeSummary?.changeDetails && snap.changeSummary.changeDetails.length > 0 ? (
                          <div className="text-xs text-orange-400 max-w-xs truncate">
                            {snap.changeSummary.changeDetails[0]}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Baseline unchanged</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {new Date(snap.monitoredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
