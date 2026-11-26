'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertCircle,
  Clock,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  Check,
  Activity,
  Flame,
  Info,
} from 'lucide-react';

interface UsageItem {
  featureKey: string;
  featureName: string;
  consumed: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
  unit: string;
}

interface SubscriptionStatus {
  workspaceId: string;
  planTier: 'free' | 'starter' | 'professional' | 'agency';
  planName: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  isActive: boolean;
  isGracePeriod: boolean;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  renewalDate?: string;
  usage: UsageItem[];
}

interface SubscriptionPlan {
  _id: string;
  planTier: string;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  entitlements: {
    monthlyLeadDiscoveryLimit: number;
    monthlyWebsiteAnalysisLimit: number;
    monthlyAiQualificationLimit: number;
    monthlyOutreachDraftsLimit: number;
    managedClientWebsitesLimit: number;
    teamMembersLimit: number;
    monthlyReportsLimit: number;
  };
}

export default function SubscriptionsDashboardPage() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchStatusAndPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authRes = await fetch('/auth/me');
      if (!authRes.ok) throw new Error('Failed to authenticate session');
      const authData = await authRes.json();
      const wsId = authData.data?.activeWorkspace?.id;

      if (!wsId) throw new Error('No active workspace selected');

      const [statusRes, plansRes] = await Promise.all([
        fetch(`/api/workspaces/${wsId}/subscriptions/status`),
        fetch(`/api/workspaces/${wsId}/subscriptions/plans`),
      ]);

      if (!statusRes.ok) throw new Error('Failed to load subscription status');
      if (!plansRes.ok) throw new Error('Failed to load available plans');

      const statusJson = await statusRes.json();
      const plansJson = await plansRes.json();

      setStatus(statusJson.data);
      setPlans(plansJson.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndPlans();
  }, []);

  const handlePlanUpgrade = async (tier: string) => {
    if (!status?.workspaceId) return;

    startTransition(async () => {
      try {
        setError(null);
        setSuccessMessage(null);

        const csrfToken = document.cookie
          .split('; ')
          .find((row) => row.startsWith('clienthunt_csrf='))
          ?.split('=')[1];

        const res = await fetch(`/api/workspaces/${status.workspaceId}/subscriptions/change-plan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken || '',
          },
          body: JSON.stringify({
            newTier: tier,
            reason: `Switched tier to ${tier} via self-service`,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || 'Failed to switch plan tier');
        }

        setSuccessMessage(`Workspace subscription successfully switched to ${tier.toUpperCase()}`);
        await fetchStatusAndPlans();
      } catch (err: any) {
        setError(err.message || 'Failed to change plan');
      }
    });
  };

  const getPlanHighlight = (tier: string) => {
    switch (tier) {
      case 'professional':
        return { badge: 'Most Popular', glow: 'ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/10' };
      case 'agency':
        return { badge: 'Maximum Scale', glow: 'border-purple-300 dark:border-purple-800' };
      default:
        return { badge: null, glow: '' };
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl border border-slate-800">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute right-32 -bottom-20 h-48 w-48 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Workspace SaaS Entitlements</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Plans, Quotas & Metered Usage
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Empower your agency with transparent monthly limits, instant zero-downtime tier switches, and verified feature allocations.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="bg-slate-800/80 backdrop-blur-md rounded-xl p-4 border border-slate-700/60 shadow-inner flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 border border-indigo-500/40">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Plan</div>
                  <div className="text-base font-bold text-white capitalize">{status?.planName || 'Free Community'}</div>
                </div>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {status?.subscriptionStatus || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/30 flex items-start gap-3 backdrop-blur-sm">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Notice</h3>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/30 flex items-start gap-3 backdrop-blur-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Success</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Quick Health & Period Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Period</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{status?.periodKey || '2026-11'}</div>
              <div className="text-xs text-slate-500 mt-0.5">Resets on 1st of month</div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Entitlement Status</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {status?.usage.filter((u) => u.isExceeded).length === 0 ? 'Optimal' : 'Quota Alert'}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Zero service interruption</div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Quota Consumption</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {status?.usage.length ? `${status.usage.filter((u) => (u.consumed / u.limit) > 0.8).length} Nearing Limit` : 'All Available'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Real-time telemetry</div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
              <Activity className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account Health</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 capitalize">{status?.subscriptionStatus || 'Active'}</div>
              <div className="text-xs text-slate-500 mt-0.5">Multi-tenant isolated</div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-100 dark:border-purple-900/40">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Metered Usage Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-indigo-500" />
                Monthly Quota Meters
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Atomic verification prevents accidental quota overages across discovery, website analysis, and team seats.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Info className="h-3.5 w-3.5 text-indigo-500" />
              <span>Resets automatically on 1st of each month</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {status?.usage.map((item) => {
              const percentage = Math.min(100, Math.round((item.consumed / item.limit) * 100));
              const isDanger = percentage >= 90;
              const isWarning = percentage >= 70 && percentage < 90;

              return (
                <div
                  key={item.featureKey}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.featureName}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isDanger
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : isWarning
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          isDanger
                            ? 'bg-gradient-to-r from-rose-500 to-red-600'
                            : isWarning
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-3 text-xs text-slate-600 dark:text-slate-400">
                      <span>Consumed: <strong className="text-slate-900 dark:text-white">{item.consumed.toLocaleString()}</strong></span>
                      <span>Cap: <strong className="text-slate-900 dark:text-white">{item.limit.toLocaleString()} {item.unit}</strong></span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/40 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Remaining</span>
                    <span className={`font-bold ${item.remaining === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                      {item.remaining.toLocaleString()} {item.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Tiers Matrix */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-3xl">
              Flexible Agency Subscription Tiers
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upgrade or downgrade instantly. All limits recalculate in real-time with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => {
              const isCurrent = status?.planTier === p.planTier;
              const highlight = getPlanHighlight(p.planTier);

              return (
                <div
                  key={p._id}
                  className={`relative rounded-2xl bg-white dark:bg-slate-900 border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
                    isCurrent
                      ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : highlight.glow
                      ? `${highlight.glow} border-slate-300 dark:border-slate-700`
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {highlight.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm tracking-wide uppercase">
                      {highlight.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{p.name}</h3>
                      {isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 uppercase">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[32px] leading-relaxed">
                      {p.description}
                    </p>

                    <div className="my-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-extrabold text-slate-900 dark:text-white">${p.priceMonthly}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">/ month</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span><strong>{p.entitlements.monthlyLeadDiscoveryLimit.toLocaleString()}</strong> Lead Discoveries / mo</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span><strong>{p.entitlements.monthlyWebsiteAnalysisLimit.toLocaleString()}</strong> Website Audits / mo</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span><strong>{p.entitlements.monthlyAiQualificationLimit.toLocaleString()}</strong> AI Qualifications / mo</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span><strong>{p.entitlements.monthlyOutreachDraftsLimit.toLocaleString()}</strong> Outreach Drafts / mo</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span><strong>{p.entitlements.managedClientWebsitesLimit.toLocaleString()}</strong> Client Websites</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span><strong>{p.entitlements.teamMembersLimit.toLocaleString()}</strong> Team Seats</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePlanUpgrade(p.planTier)}
                    disabled={isCurrent || isPending}
                    className={`mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                      isCurrent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        : highlight.badge
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900'
                    }`}
                  >
                    {isCurrent ? (
                      'Active Plan'
                    ) : (
                      <>
                        Switch to {p.name} <ArrowUpRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
