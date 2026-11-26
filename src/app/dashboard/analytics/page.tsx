'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import type { ConversionAnalyticsSummary } from '@clienthunt/shared';
import {
  TrendingUp,
  Award,
  Send,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Globe,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { activeWorkspace } = useAuth();
  const [data, setData] = useState<ConversionAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [countryFilter, setCountryFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (countryFilter) queryParams.set('country', countryFilter);

        const now = new Date();
        if (dateRangeFilter === '7d') {
          const past = new Date(now.getTime() - 7 * 86400000);
          queryParams.set('startDate', past.toISOString());
        } else if (dateRangeFilter === '30d') {
          const past = new Date(now.getTime() - 30 * 86400000);
          queryParams.set('startDate', past.toISOString());
        }

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const res = await fetch(`${apiUrl}/crm/analytics/conversion${queryString}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const body = await res.json();
          if (body.success) {
            setData(body.data);
          } else {
            setError(body.error?.message || 'Failed to load conversion analytics');
          }
        } else {
          setError(`HTTP Error: ${res.status}`);
        }
      } catch (err: any) {
        setError(err.message || 'Network error fetching analytics');
      } finally {
        setLoading(false);
      }
    };
    void fetchStats();
  }, [activeWorkspace, apiUrl, countryFilter, dateRangeFilter]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header and Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1a2740] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Conversion Analytics & Revenue Telemetry</h1>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic, audit-verified lead acquisition and revenue conversion metrics for{' '}
              <span className="text-indigo-400 font-semibold">{activeWorkspace?.workspace.name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0c1424] border border-[#17253e] px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              >
                <option value="all" className="bg-[#0c1424] text-white">All Time</option>
                <option value="30d" className="bg-[#0c1424] text-white">Last 30 Days</option>
                <option value="7d" className="bg-[#0c1424] text-white">Last 7 Days</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-[#0c1424] border border-[#17253e] px-3 py-1.5 rounded-lg text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              >
                <option value="" className="bg-[#0c1424] text-white">All Countries</option>
                <option value="us" className="bg-[#0c1424] text-white">United States (US)</option>
                <option value="gb" className="bg-[#0c1424] text-white">United Kingdom (UK)</option>
                <option value="ca" className="bg-[#0c1424] text-white">Canada (CA)</option>
                <option value="au" className="bg-[#0c1424] text-white">Australia (AU)</option>
              </select>
            </div>
          </div>
        </div>

        {/* State Display: Loading, Error, Content */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Computing deterministic conversion telemetry...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/50 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">Error Loading Telemetry</div>
              <div className="text-xs text-red-300/80">{error}</div>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Top KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Discovered & Qualified */}
              <div className="p-5 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Discovered Pool</span>
                  <Layers className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-bold text-white">{data.metrics.discoveredLeads}</div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#17253e]/60">
                  <span>Qualified: {data.metrics.qualifiedLeads}</span>
                  <span className="text-sky-400 font-medium">{data.rates.qualificationRate}%</span>
                </div>
              </div>

              {/* Outreach & Contact */}
              <div className="p-5 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Actually Contacted</span>
                  <Send className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-white">{data.metrics.actuallyContactedLeads}</div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#17253e]/60">
                  <span>Contact Rate</span>
                  <span className="text-indigo-400 font-medium">{data.rates.contactRate}%</span>
                </div>
              </div>

              {/* Manually Recorded Replies */}
              <div className="p-5 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Manually Recorded Replies</span>
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                </div>
                <div className="text-2xl font-bold text-white">{data.metrics.manuallyRecordedReplies}</div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#17253e]/60">
                  <span>Reply Rate</span>
                  <span className="text-violet-400 font-medium">{data.rates.replyRate}%</span>
                </div>
              </div>

              {/* Won Deals & Win Rate */}
              <div className="p-5 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Closed Won Deals</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-emerald-400">{data.metrics.wonDealsCount}</div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-[#17253e]/60">
                  <span>Win Rate: {data.rates.winRate}%</span>
                  <span className="text-slate-400">Lost: {data.metrics.lostDeals}</span>
                </div>
              </div>
            </div>

            {/* Currency-Safe Revenue & Deal Breakdown */}
            <div className="p-6 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#17253e] pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Actual Recorded Revenue (Multi-Currency Safe)
                  </h3>
                </div>
                <div className="text-xs text-slate-400">
                  Won Deals With Value: <span className="text-white font-semibold">{data.metrics.wonDealsWithRecordedValue}</span> |
                  Without Value: <span className="text-amber-400 font-semibold">{data.metrics.wonDealsWithoutRecordedValue}</span>
                </div>
              </div>

              {data.revenue.byCurrency.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No positive deal values recorded yet for Won deals in this filter selection.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {data.revenue.byCurrency.map((curr) => (
                    <div
                      key={curr.currency}
                      className="p-4 rounded-xl bg-[#080d18] border border-[#1a2942] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                          {curr.currency}
                        </span>
                        <span className="text-xs text-slate-400">{curr.wonDealsCount} Won Deal(s)</span>
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {curr.currency} {curr.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        Avg Deal Value: <span className="text-slate-200">{curr.currency} {curr.averageDealValue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Full Conversion Funnel Visualizer */}
            <div className="p-6 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-5">
              <div className="flex items-center justify-between border-b border-[#17253e] pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Lifecycle Conversion Funnel
                  </h3>
                </div>
                <div className="text-xs text-slate-400">
                  Overall Conversion (Discovered → Won): <span className="text-emerald-400 font-bold">{data.rates.overallConversionRate}%</span>
                </div>
              </div>

              <div className="space-y-3">
                {data.funnel.map((step, idx) => {
                  const maxCount = Math.max(...data.funnel.map((f) => f.count), 1);
                  const barWidth = Math.max(Math.round((step.count / maxCount) * 100), 4);
                  return (
                    <div key={step.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#17253e] text-slate-400 flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          {step.label}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">{step.count}</span>
                          <span className="text-slate-400 text-[11px] w-20 text-right">
                            {idx === 0 ? '100%' : `${step.conversionFromPrevious}% of prev`}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#080d18] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Country-Wise Performance Heat Breakdown */}
            <div className="p-6 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-4">
              <div className="flex items-center gap-2 border-b border-[#17253e] pb-3">
                <Globe className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Country-Wise Conversion Telemetry
                </h3>
              </div>

              {data.countryBreakdown.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  No country records found matching current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#17253e] text-slate-400">
                        <th className="pb-2 font-semibold">Country</th>
                        <th className="pb-2 font-semibold">Discovered</th>
                        <th className="pb-2 font-semibold">Qualified</th>
                        <th className="pb-2 font-semibold">Contacted</th>
                        <th className="pb-2 font-semibold">Replies</th>
                        <th className="pb-2 font-semibold">Won</th>
                        <th className="pb-2 font-semibold">Win Rate</th>
                        <th className="pb-2 font-semibold">Recorded Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#17253e]/60 text-slate-300">
                      {data.countryBreakdown.map((c) => {
                        const revStrings = Object.entries(c.revenueByCurrency).map(
                          ([curr, amt]) => `${curr} ${amt.toLocaleString()}`
                        );
                        return (
                          <tr key={c.countryCode} className="hover:bg-[#101b30]/50 transition-colors">
                            <td className="py-3 font-medium text-white flex items-center gap-2">
                              <span className="uppercase text-[11px] px-1.5 py-0.5 rounded bg-[#17253e] text-slate-300 font-mono">
                                {c.countryCode}
                              </span>
                              {c.countryName}
                            </td>
                            <td className="py-3">{c.discoveredLeads}</td>
                            <td className="py-3 text-sky-400 font-medium">{c.qualifiedLeads}</td>
                            <td className="py-3 text-indigo-400 font-medium">{c.contactedLeads}</td>
                            <td className="py-3 text-violet-400 font-medium">{c.manuallyRecordedReplies}</td>
                            <td className="py-3 text-emerald-400 font-bold">{c.wonDeals}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                                {c.winRate}%
                              </span>
                            </td>
                            <td className="py-3 font-semibold text-white">
                              {revStrings.length > 0 ? revStrings.join(', ') : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
