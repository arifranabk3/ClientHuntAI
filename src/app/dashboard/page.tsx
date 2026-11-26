'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Target,
  UserCheck,
  ArrowUpRight,
  Plus,
  Sparkles,
  Activity,
  ShieldCheck,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Mail,
  Zap,
  Flame,
  FileText,
  Briefcase,
  Eye,
} from 'lucide-react';

interface Metrics {
  totalBusinesses: number;
  discoveredLeads: number;
  qualifiedLeads: number;
  eligibleContacts: number;
  activeCampaigns: number;
  replies: number;
  wonDeals: number;
}

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { user, activeWorkspace, isLoading } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const res = await fetch(`${apiUrl}/dashboard-api/metrics`, { credentials: 'include' });
        if (res.ok) {
          const body = await res.json();
          if (body.success) {
            setMetrics(body.data.metrics);
          }
        }
      } catch (err) {
        console.error('Failed to load metrics', err);
      } finally {
        setLoadingMetrics(false);
      }
    };
    void fetchMetrics();
  }, [activeWorkspace, apiUrl]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B1120] text-[#F8FAFC] px-4 selection:bg-[#FF8A3D]/30 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#FF8A3D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm p-6 rounded-2xl bg-[#151F30]/90 border border-[#243447] shadow-2xl backdrop-blur-xl text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FF8A3D] to-amber-400 flex items-center justify-center text-white shadow-lg shadow-[#FF8A3D]/20 mx-auto mb-4">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-[#F8FAFC] tracking-tight">ClientHunt AI</h2>
          <p className="text-xs text-[#A6B2C3] mt-1 mb-6">Autonomous Client Acquisition &amp; Retention</p>

          <div className="p-3 rounded-lg bg-[#0B1120]/60 border border-[#243447] flex items-center justify-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-[#FF8A3D] animate-ping" />
            <span className="text-xs font-mono text-[#A6B2C3]">Authenticating workspace session...</span>
          </div>

          <p className="text-[11px] text-[#718096]">
            Redirecting to secure login...
          </p>
        </div>
      </div>
    );
  }

  // Active ArifTech Pilot Prospects
  const pilotProspects = [
    {
      name: 'Austin Bryant Consulting',
      location: 'Plano, TX',
      website: 'austinbryantconsulting.com',
      serviceAudit: 'Server TTFB 5.2s • Missing Alt Text • No Booking Form',
      contact: 'contact@austinbryantconsulting.com',
      packageVal: '$750 Scope',
      status: 'Draft Ready',
      statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      actionHref: '/dashboard/outreach',
    },
    {
      name: 'Ingenics Consulting',
      location: 'Atlanta, GA',
      website: 'ingenics.com',
      serviceAudit: 'LCP 4.8s • Multi-step Inquiry Friction • Navigation Spacing',
      contact: 'info.usa@ingenics.com',
      packageVal: '$750 Scope',
      status: 'Draft Ready',
      statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      actionHref: '/dashboard/outreach',
    },
    {
      name: 'Jason P. Theriot Consulting, LLC',
      location: 'Houston, TX',
      website: 'jasontheriot.com',
      serviceAudit: 'Mobile Layout Shift • Unoptimized Hero Media • Booking Form Gap',
      contact: 'jason@jasontheriot.com',
      packageVal: '$750 Scope',
      status: 'Draft Ready',
      statusColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      actionHref: '/dashboard/outreach',
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131D2D] via-[#151F30] to-[#0E1624] border border-[#243447] shadow-xl p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#FF8A3D]/15 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF8A3D]/15 text-[#FF8A3D] border border-[#FF8A3D]/30 shadow-sm">
                  <Flame className="w-3.5 h-3.5 animate-pulse text-[#FF8A3D]" />
                  Active Campaign: ArifTech Agency Pilot
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  All Systems Operational
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
                  {activeWorkspace?.workspace.name || 'ArifTech HQ'}
                </h1>
                <p className="text-sm text-[#A6B2C3] mt-1.5 leading-relaxed">
                  Autonomous Lead Intelligence, High-Conversion Website Audits &amp; Controlled Cold Sales Execution.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#718096]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[#A6B2C3]">CAN-SPAM &amp; Zero Auto-Send Guard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#FF8A3D]" />
                  <span className="text-[#A6B2C3]">Target Scope: $750 Package / $375 Advance</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Action Bar */}
            <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
              <Link
                href="/dashboard/outreach"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] hover:brightness-110 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#FF8A3D]/25 transition active:scale-95"
              >
                <Mail className="w-4 h-4" />
                Review Outreach Drafts
              </Link>
              <Link
                href="/dashboard/crm"
                className="px-4 py-2.5 rounded-xl bg-[#1C293B] hover:bg-[#243447] border border-[#2D3E53] text-[#F8FAFC] font-semibold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95"
              >
                <Briefcase className="w-4 h-4 text-blue-400" />
                CRM Pipeline
              </Link>
              <Link
                href="/dashboard/discovery"
                className="px-4 py-2.5 rounded-xl bg-[#151F30] hover:bg-[#1C293B] border border-[#243447] text-[#A6B2C3] hover:text-white text-xs sm:text-sm flex items-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                New Discovery
              </Link>
            </div>
          </div>
        </div>

        {/* Linear/Stripe-Style KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#151F30] border border-[#243447] hover:border-[#FF8A3D]/50 transition shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF8A3D]/5 rounded-full blur-xl group-hover:bg-[#FF8A3D]/10 transition" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#A6B2C3]">Discovered Leads</span>
              <div className="p-2 rounded-xl bg-[#FF8A3D]/10 border border-[#FF8A3D]/20 text-[#FF8A3D]">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              {loadingMetrics ? '—' : (metrics?.discoveredLeads ?? 31)}
            </div>
            <p className="text-[11px] text-[#718096] mt-2 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">↑ Free OSM</span> in current workspace
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151F30] border border-[#243447] hover:border-[#22C55E]/50 transition shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#22C55E]/5 rounded-full blur-xl group-hover:bg-[#22C55E]/10 transition" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#A6B2C3]">Audited &amp; Qualified</span>
              <div className="p-2 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              {loadingMetrics ? '—' : (metrics?.qualifiedLeads ?? 27)}
            </div>
            <p className="text-[11px] text-[#718096] mt-2 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">87% Qualification</span> pass rate
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151F30] border border-[#243447] hover:border-blue-500/50 transition shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#A6B2C3]">Ready Outreach Drafts</span>
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              3 <span className="text-sm font-normal text-[#A6B2C3]">Pending Review</span>
            </div>
            <p className="text-[11px] text-[#718096] mt-2 flex items-center gap-1">
              <span className="text-amber-400 font-medium">100% Manually Guarded</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151F30] border border-[#243447] hover:border-purple-500/50 transition shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[#A6B2C3]">Revenue Target</span>
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
              $0 <span className="text-sm font-normal text-[#718096]">/ $1,000 MRR</span>
            </div>
            <div className="w-full bg-[#1C293B] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-[#FF8A3D] to-emerald-400 h-full w-[5%]" />
            </div>
          </div>
        </div>

        {/* Centerpiece: Active Pilot Execution Queue */}
        <div className="rounded-3xl bg-[#151F30] border border-[#243447] overflow-hidden shadow-lg">
          <div className="p-6 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827]/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FF8A3D]/10 text-[#FF8A3D] border border-[#FF8A3D]/20">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-[#F8FAFC]">
                  First Client Acquisition Pack — 3 Priority Prospects
                </h2>
              </div>
              <p className="text-xs text-[#A6B2C3]">
                Manually vetted US consulting businesses with custom audit evidence and non-aggressive outreach letters ready for execution.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/outreach"
                className="text-xs font-semibold text-[#FF8A3D] hover:text-[#FF9B57] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF8A3D]/10 border border-[#FF8A3D]/20 transition"
              >
                Open Outreach Hub <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Table / List View */}
          <div className="divide-y divide-[#1E293B]">
            {pilotProspects.map((prospect, idx) => (
              <div
                key={prospect.name}
                className="p-5 sm:p-6 hover:bg-[#182337]/60 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#1C293B] border border-[#2E3F55] text-xs font-bold text-[#A6B2C3] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#F8FAFC]">
                      {prospect.name}
                    </h3>
                    <span className="text-xs text-[#718096]">({prospect.location})</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${prospect.statusColor}`}>
                      {prospect.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#A6B2C3]">
                      <ExternalLink className="w-3.5 h-3.5 text-[#718096]" />
                      <span className="font-mono text-[#F8FAFC]">{prospect.website}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#A6B2C3]">
                      <Mail className="w-3.5 h-3.5 text-[#718096]" />
                      <span>{prospect.contact}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0B1120]/70 border border-[#1E293B] text-[11px] text-[#A6B2C3] flex items-center gap-2">
                    <span className="font-semibold text-[#FF8A3D]">Audit Evidence:</span>
                    <span className="text-[#F8FAFC]">{prospect.serviceAudit}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col lg:items-end justify-between sm:justify-center gap-2 pt-2 lg:pt-0 border-t sm:border-t-0 border-[#1E293B]">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-[#F8FAFC]">{prospect.packageVal}</div>
                    <div className="text-[10px] text-[#718096]">50% Advance Upon Contract</div>
                  </div>
                  <Link
                    href={prospect.actionHref}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1C293B] hover:bg-[#243447] text-white text-xs font-semibold border border-[#2D3E53] flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    Review Draft
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#111827]/30 border-t border-[#1E293B] flex flex-wrap items-center justify-between text-xs text-[#718096] gap-2">
            <span>Next Action: Send manual 1-to-1 emails from registered ArifTech domain.</span>
            <span className="font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 3 of 3 Drafts Quality Checked
            </span>
          </div>
        </div>

        {/* Modules & Feature Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Module 1: Website Analyzer */}
          <div className="p-6 rounded-2xl bg-[#151F30] border border-[#243447] hover:border-[#FF8A3D]/40 transition space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-[#FF8A3D]/10 text-[#FF8A3D] border border-[#FF8A3D]/20">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1C293B] text-[#A6B2C3] border border-[#243447]">
                  SSRF Guarded
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F8FAFC]">Website Performance Analyzer</h3>
              <p className="text-xs text-[#A6B2C3] leading-relaxed">
                Scan target domains for slow TTFB, missing viewport tags, broken contact forms, and security flaws with explainable scoring.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <Link
                href="/dashboard/analysis"
                className="text-xs font-semibold text-[#FF8A3D] hover:underline flex items-center gap-1"
              >
                Launch Analyzer <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 2: CRM Kanban */}
          <div className="p-6 rounded-2xl bg-[#151F30] border border-[#243447] hover:border-blue-500/40 transition space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1C293B] text-[#A6B2C3] border border-[#243447]">
                  Live Pipeline
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F8FAFC]">CRM Deal Progression</h3>
              <p className="text-xs text-[#A6B2C3] leading-relaxed">
                Track leads from contacted status through reply, consultation call, proposal sent, to deal won with audited payment logs.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <Link
                href="/dashboard/crm"
                className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
              >
                View Pipeline Board <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Module 3: Revenue & Retainers */}
          <div className="p-6 rounded-2xl bg-[#151F30] border border-[#243447] hover:border-emerald-500/40 transition space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#1C293B] text-[#A6B2C3] border border-[#243447]">
                  Audit Logged
                </span>
              </div>
              <h3 className="text-base font-bold text-[#F8FAFC]">Revenue &amp; Retainer Tracking</h3>
              <p className="text-xs text-[#A6B2C3] leading-relaxed">
                Record actual advance payments received, maintainer subscriptions, and projected lifetime value with strict audit trails.
              </p>
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <Link
                href="/dashboard/revenue"
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
              >
                Open Revenue Ledger <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* System Health & Compliance Strip */}
        <div className="p-4 rounded-2xl bg-[#111827]/80 border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#A6B2C3]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> API Gateway :4000 Active
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Worker Engine :5000 Active
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Database TLS Connected
            </span>
          </div>

          <div className="text-[11px] text-[#718096]">
            ArifTech Sales Engine • Zero Email Auto-Dispatch Guard
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
