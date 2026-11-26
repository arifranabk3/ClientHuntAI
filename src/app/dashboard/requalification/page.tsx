'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  BrainCircuit,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Filter,
} from 'lucide-react';

interface RequalSnapshot {
  _id: string;
  leadIntelligenceId: string;
  businessId: {
    _id: string;
    name: string;
    websiteUrl?: string;
    city?: string;
    country?: string;
  };
  previousScore: number;
  newScore: number;
  scoreDelta: number;
  previousStatus: string;
  newStatus: string;
  statusChanged: boolean;
  scoreChanged: boolean;
  opportunityImproved: boolean;
  requiresHumanReview: boolean;
  reasons: string[];
  dataSourcesUsed: string[];
  requalifiedAt: string;
  triggeredBy: string;
}

interface SummaryMetrics {
  totalSnapshots: number;
  improvedCount: number;
  reviewNeededCount: number;
  scoreChangedCount: number;
}

export default function RequalificationPage() {
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalSnapshots: 0,
    improvedCount: 0,
    reviewNeededCount: 0,
    scoreChangedCount: 0,
  });
  const [snapshots, setSnapshots] = useState<RequalSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterImproved, setFilterImproved] = useState(false);
  const [filterReview, setFilterReview] = useState(false);
  const [onDemandLeadId, setOnDemandLeadId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const summaryRes = await fetch('/api/requalification/summary');
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        if (json.data?.metrics) {
          setMetrics(json.data.metrics);
        }
      }

      let url = '/api/requalification/snapshots?limit=50';
      if (filterImproved) url += '&opportunityImproved=true';
      if (filterReview) url += '&requiresHumanReview=true';

      const listRes = await fetch(url);
      if (listRes.ok) {
        const json = await listRes.json();
        if (json.data?.snapshots) {
          setSnapshots(json.data.snapshots);
        }
      }
    } catch {
      // Graceful fallback for mock/disconnected environments
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterImproved, filterReview]);

  const handleRequalifyNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onDemandLeadId.trim()) return;

    try {
      setSubmitting(true);
      setActionMessage(null);
      const res = await fetch('/api/requalification/requalify-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIntelligenceId: onDemandLeadId.trim(),
          forceReassessment: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setActionMessage(
          `Success: Requalified lead. Score: ${data.data.previousScore} -> ${data.data.newScore} (Delta: ${data.data.scoreDelta > 0 ? '+' : ''}${data.data.scoreDelta})`
        );
        setOnDemandLeadId('');
        fetchData();
      } else {
        setActionMessage(`Error: ${data.error?.message || 'Requalification failed.'}`);
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
              <BrainCircuit className="w-8 h-8 text-orange-500" />
              Automatic Lead Requalification Engine
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Continuously re-evaluates prospects against latest website health, monitoring snapshots, and consulting procurement signals.
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

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Total Requalifications</span>
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{metrics.totalSnapshots}</div>
            <div className="text-xs text-slate-500 mt-1">Permanent immutable audit logs</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Improved Opportunities</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400 mt-2">{metrics.improvedCount}</div>
            <div className="text-xs text-slate-500 mt-1">New technical pain points or growth</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Requires SDR Review</span>
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400 mt-2">{metrics.reviewNeededCount}</div>
            <div className="text-xs text-slate-500 mt-1">Status changes or low confidence</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Score Volatility</span>
              <RefreshCw className="w-5 h-5 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{metrics.scoreChangedCount}</div>
            <div className="text-xs text-slate-500 mt-1">Leads with delta score adjustments</div>
          </div>
        </div>

        {/* On-Demand Requalification Trigger */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-500" />
            Run Immediate Lead Reassessment
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Forces an immediate 100-point requalification recalculation using fresh website analyzer and monitoring snapshots.
          </p>
          <form onSubmit={handleRequalifyNow} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter LeadIntelligence ID (e.g., 6659f8...)"
              value={onDemandLeadId}
              onChange={(e) => setOnDemandLeadId(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={submitting || !onDemandLeadId.trim()}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Requalify Now'}
            </button>
          </form>
          {actionMessage && (
            <div className="mt-3 p-3 bg-slate-800/80 border border-slate-700 text-xs text-slate-300 rounded-lg">
              {actionMessage}
            </div>
          )}
        </div>

        {/* History Table & Filters */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-500" />
              Requalification Snapshots & History
            </h3>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterImproved}
                  onChange={(e) => setFilterImproved(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-orange-600 focus:ring-0"
                />
                Improved Only
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
                  <th className="px-5 py-3.5">Business / Lead</th>
                  <th className="px-5 py-3.5">Previous Score</th>
                  <th className="px-5 py-3.5">New Score</th>
                  <th className="px-5 py-3.5">Delta</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Reasons</th>
                  <th className="px-5 py-3.5">Requalified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      Loading requalification snapshots...
                    </td>
                  </tr>
                ) : snapshots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No requalification snapshots found.
                    </td>
                  </tr>
                ) : (
                  snapshots.map((snap) => (
                    <tr key={snap._id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="font-medium text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          {snap.businessId?.name || 'Prospect Lead'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {snap.businessId?.city || 'USA'}, {snap.businessId?.country || 'US'}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono">{snap.previousScore}/100</td>
                      <td className="px-5 py-4 font-mono font-semibold text-white">{snap.newScore}/100</td>
                      <td className="px-5 py-4">
                        {snap.scoreDelta > 0 ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                            <TrendingUp className="w-3.5 h-3.5" />+{snap.scoreDelta}
                          </span>
                        ) : snap.scoreDelta < 0 ? (
                          <span className="flex items-center gap-1 text-rose-400 font-semibold font-mono">
                            <TrendingDown className="w-3.5 h-3.5" />{snap.scoreDelta}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">0</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            snap.newStatus === 'QUALIFIED'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                              : snap.newStatus === 'DISQUALIFIED'
                              ? 'bg-rose-950/70 text-rose-300 border border-rose-800'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {snap.newStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="text-xs text-slate-300 truncate" title={snap.reasons.join(' | ')}>
                          {snap.reasons[0] || 'No change logged'}
                        </div>
                        {snap.requiresHumanReview && (
                          <span className="inline-block mt-1 text-[10px] text-amber-400 font-medium">
                            • Review Flagged
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(snap.requalifiedAt).toLocaleString()}
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
