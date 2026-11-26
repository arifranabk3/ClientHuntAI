'use client';

import React, { useEffect, useState, useCallback, useTransition } from 'react';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  BrainCircuit,
  Award,
  Zap,
  TrendingUp,
  Target,
  Sparkles,
  Download,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightCircle,
  AlertTriangle,
  Info,
  Layers,
  ArrowUpDown,
  Briefcase,
  ChevronLeft,
} from 'lucide-react';
import type { LeadIntelligenceSummary, LeadIntelligenceDetail } from '@clienthunt/shared';

interface JobSummary {
  id: string;
  targetUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  opportunityScore?: number;
  opportunityGrade?: string;
  errorMessage?: string;
  analyzedAt?: string;
  createdAt: string;
}

interface JobCounts {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}

export default function LeadIntelligencePage() {
  const { activeWorkspace, csrfToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const [, startTransition] = useTransition();

  // Metrics summary
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalDiscovered: 0,
    totalQualified: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    reviewNeeded: 0,
    disqualified: 0,
    convertedToCrm: 0,
    conversionRate: 0,
    pendingJobs: 0,
    processingJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    averageOpportunityScore: 0,
    averageBusinessFitScore: 0,
    averageQualificationScore: 0,
    totalEvaluated: 0,
  });

  // Leads table states
  const [leads, setLeads] = useState<LeadIntelligenceSummary[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  // Filters & Search & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'opportunity' | 'fit'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected lead detail modal / drawer
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadDetail, setLeadDetail] = useState<LeadIntelligenceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [rescoring, setRescoring] = useState(false);

  // CRM Promotion Dialog State
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState<LeadIntelligenceDetail | null>(null);
  const [crmConverting, setCrmConverting] = useState(false);
  const [crmSuccess, setCrmSuccess] = useState<{ leadId: string; message: string } | null>(null);
  const [crmError, setCrmError] = useState<string | null>(null);
  const [overrideConfidence, setOverrideConfidence] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // Job Processing Panel
  const [recentJobs, setRecentJobs] = useState<JobSummary[]>([]);
  const [jobCounts, setJobCounts] = useState<JobCounts>({
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
  });
  const [loadingJobs, setLoadingJobs] = useState(false);

  // User role check
  const userRole = activeWorkspace?.role || 'member';
  const canOverrideConfidence =
    userRole === 'workspace_admin' || userRole === 'workspace_owner' || userRole === 'super_admin';

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch summary widgets
  const fetchSummary = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`${apiUrl}/intelligence/summary`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSummaryMetrics((prev) => ({ ...prev, ...data.data }));
      }
    } catch (err) {
      console.error('Failed to load intelligence summary', err);
    }
  }, [activeWorkspace, apiUrl]);

  // Fetch background jobs status
  const fetchJobs = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoadingJobs(true);
    try {
      const res = await fetch(`${apiUrl}/intelligence/jobs?limit=8`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRecentJobs(data.data.jobs || []);
        if (data.data.counts) {
          setJobCounts(data.data.counts);
        }
      }
    } catch (err) {
      console.error('Failed to load intelligence background jobs', err);
    } finally {
      setLoadingJobs(false);
    }
  }, [activeWorkspace, apiUrl]);

  // Fetch leads table
  const fetchLeads = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setTableError(null);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        priority: priorityFilter,
        qualificationStatus: statusFilter,
        sortBy,
        sortOrder,
      });
      if (debouncedSearch) q.append('search', debouncedSearch);
      if (countryFilter) q.append('country', countryFilter);
      if (industryFilter) q.append('industry', industryFilter);
      if (minScoreFilter) q.append('minScore', minScoreFilter);

      const res = await fetch(`${apiUrl}/intelligence/leads?${q.toString()}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.data.items || []);
        setTotalLeads(data.data.pagination.total || 0);
      } else {
        const errData = await res.json().catch(() => ({}));
        setTableError(errData.error?.message || 'Failed to load intelligence leads.');
      }
    } catch (err) {
      console.error('Failed to load intelligence leads', err);
      setTableError('Network error while fetching leads. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, [
    activeWorkspace,
    apiUrl,
    page,
    limit,
    priorityFilter,
    statusFilter,
    debouncedSearch,
    countryFilter,
    industryFilter,
    minScoreFilter,
    sortBy,
    sortOrder,
  ]);

  // Initial and refresh load
  useEffect(() => {
    fetchSummary();
    fetchLeads();
    fetchJobs();
  }, [fetchSummary, fetchLeads, fetchJobs]);

  // Load Lead Detail
  const handleViewDetail = async (id: string) => {
    setSelectedLeadId(id);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await fetch(`${apiUrl}/intelligence/leads/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLeadDetail(data.data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setDetailError(errData.error?.message || 'Failed to load lead details.');
      }
    } catch (err) {
      console.error('Failed to load lead detail', err);
      setDetailError('Network error while retrieving lead detail.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Re-score Lead
  const handleRescore = async () => {
    if (!selectedLeadId || !csrfToken) return;
    setRescoring(true);
    try {
      const res = await fetch(`${apiUrl}/intelligence/rescore/${selectedLeadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLeadDetail(data.data);
        fetchSummary();
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to re-score lead', err);
    } finally {
      setRescoring(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    window.open(`${apiUrl}/intelligence/export`, '_blank');
  };

  // Open CRM Convert Modal
  const handleOpenCrmModal = (lead: LeadIntelligenceDetail) => {
    setConvertingLead(lead);
    setCrmSuccess(null);
    setCrmError(null);
    setOverrideConfidence(false);
    setOverrideReason('');
    setShowCrmModal(true);
  };

  // Execute CRM Conversion
  const handleExecuteCrmConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead || !csrfToken) return;

    if (overrideConfidence && !overrideReason.trim()) {
      setCrmError('A non-empty override reason is required for manual confidence override.');
      return;
    }

    setCrmConverting(true);
    setCrmError(null);
    setCrmSuccess(null);

    try {
      const payload: Record<string, any> = {};
      if (overrideConfidence) {
        payload.overrideConfidence = true;
        payload.overrideReason = overrideReason.trim();
      }

      const res = await fetch(`${apiUrl}/intelligence/leads/${convertingLead.id}/convert-to-crm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const body = await res.json();
      if (res.ok && body.success) {
        setCrmSuccess({
          leadId: body.data.leadId,
          message: body.data.alreadyExisted
            ? 'Lead was already converted to CRM. Record linked successfully.'
            : 'Successfully promoted intelligence lead to CRM pipeline!',
        });
        // Refresh detail and table
        fetchSummary();
        fetchLeads();
        if (selectedLeadId === convertingLead.id) {
          handleViewDetail(convertingLead.id);
        }
      } else {
        setCrmError(body.error?.message || 'Failed to convert lead to CRM.');
      }
    } catch (err) {
      console.error('Error during CRM conversion', err);
      setCrmError('Network error during conversion.');
    } finally {
      setCrmConverting(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'High Priority':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Medium Priority':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Low Priority':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getStatusBadge = (s?: string) => {
    switch (s) {
      case 'QUALIFIED':
        return 'text-emerald-300 bg-emerald-950/80 border-emerald-600/40';
      case 'REVIEW_NEEDED':
        return 'text-amber-300 bg-amber-950/80 border-amber-600/40';
      case 'DISQUALIFIED':
        return 'text-rose-300 bg-rose-950/80 border-rose-600/40';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getJobStatusBadge = (s: string) => {
    switch (s) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'processing':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30 animate-pulse';
      case 'pending':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'failed':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <BrainCircuit className="w-6 h-6 text-orange-500" />
              Lead Intelligence & Qualification Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time B2B prospect qualification, website analysis telemetry, and CRM promotion pipeline.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchSummary();
                fetchLeads();
                fetchJobs();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              title="Refresh All"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-600/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* 8 Metric KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Discovered vs Evaluated */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Discovered Leads</span>
              <Building className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-white">{summaryMetrics.totalDiscovered}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summaryMetrics.totalEvaluated} scored with intelligence
            </div>
          </div>

          {/* Card 2: Qualified Leads */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Qualified Leads</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{summaryMetrics.totalQualified}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summaryMetrics.highPriority} High • {summaryMetrics.mediumPriority} Medium
            </div>
          </div>

          {/* Card 3: Review Needed & Disqualified */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Review Needed</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{summaryMetrics.reviewNeeded}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {summaryMetrics.disqualified} disqualified records
            </div>
          </div>

          {/* Card 4: CRM Conversion Statistics */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">CRM Conversions</span>
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {summaryMetrics.convertedToCrm}
              <span className="text-sm font-normal text-slate-500 ml-1.5">
                ({summaryMetrics.conversionRate}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Promoted to active sales pipeline</div>
          </div>
        </div>

        {/* Secondary KPI Bar: Background Queue Diagnostics */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <span className="font-semibold text-slate-300">Background Queue Telemetry:</span>
            <span className="text-slate-400">Deterministic MongoDB Collection Queue</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              <Clock className="w-3.5 h-3.5" /> Pending: {jobCounts.pending}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing: {jobCounts.processing}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Completed: {jobCounts.completed}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
              <XCircle className="w-3.5 h-3.5" /> Failed: {jobCounts.failed}
            </span>
          </div>
        </div>

        {/* Main Content Layout: Table & Sidebar Processing Jobs */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left 3 Cols: Lead Intelligence Table */}
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
              {/* Table Controls / Filters Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    Prospect Intelligence Callset ({totalLeads})
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Filter by qualification grade, commercial fit, opportunity index, or search businesses.
                  </p>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search Input */}
                  <div className="relative min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search business, site, city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Qualification Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="REVIEW_NEEDED">REVIEW_NEEDED</option>
                    <option value="DISQUALIFIED">DISQUALIFIED</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="High Priority">High Priority (80+)</option>
                    <option value="Medium Priority">Medium Priority (60–79)</option>
                    <option value="Low Priority">Low Priority (40–59)</option>
                    <option value="Not Qualified">Not Qualified (&lt;40)</option>
                  </select>

                  {/* Country Filter */}
                  <select
                    value={countryFilter}
                    onChange={(e) => {
                      setCountryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">All Countries</option>
                    <option value="us">United States</option>
                    <option value="gb">United Kingdom</option>
                    <option value="ca">Canada</option>
                    <option value="au">Australia</option>
                  </select>

                  {/* Industry Filter */}
                  <select
                    value={industryFilter}
                    onChange={(e) => {
                      setIndustryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">All Industries</option>
                    <option value="Construction">Construction</option>
                    <option value="Cleaning Services">Cleaning Services</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Accounting">Accounting</option>
                    <option value="IT Services">IT Services</option>
                  </select>

                  {/* Sorting Toggle */}
                  <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value as any);
                        setPage(1);
                      }}
                      className="bg-transparent px-2 py-1 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="score">Sort: Score</option>
                      <option value="opportunity">Sort: Opportunity</option>
                      <option value="fit">Sort: Fit</option>
                      <option value="date">Sort: Date</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-1.5 py-1 text-slate-400 hover:text-white"
                      title={`Order: ${sortOrder.toUpperCase()}`}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Alert Error State */}
              {tableError && (
                <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{tableError}</span>
                </div>
              )}

              {/* Data Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Business & Domain</th>
                      <th className="py-3 px-4 font-semibold">Location</th>
                      <th className="py-3 px-4 font-semibold">Industry</th>
                      <th className="py-3 px-4 font-semibold">Scores (Opp / Fit)</th>
                      <th className="py-3 px-4 font-semibold">Qualification</th>
                      <th className="py-3 px-4 font-semibold">Confidence</th>
                      <th className="py-3 px-4 font-semibold">CRM Status</th>
                      <th className="py-3 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
                            <span>Loading verified intelligence records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : leads.length > 0 ? (
                      leads.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-white max-w-[220px]">
                            <div className="flex flex-col">
                              <span className="font-semibold text-white truncate">
                                {l.businessName}
                              </span>
                              {l.website ? (
                                <a
                                  href={l.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-slate-400 hover:text-orange-400 flex items-center gap-1 mt-0.5 truncate"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{l.website.replace(/^https?:\/\//, '')}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic mt-0.5">
                                  No registered website
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300 uppercase font-mono">{l.country}</td>
                          <td className="py-3 px-4 text-slate-300 max-w-[120px] truncate">{l.industry}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <span className="text-orange-400 font-semibold" title="Website Opportunity">
                                {l.websiteOpportunityScore}
                              </span>
                              <span className="text-slate-600">/</span>
                              <span className="text-purple-400 font-semibold" title="Business Fit">
                                {l.businessFitScore}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                                  l.qualificationStatus
                                )}`}
                              >
                                {l.qualificationStatus || 'QUALIFIED'}
                              </span>
                              <span className="text-[11px] font-bold text-white">
                                {l.qualificationScore ?? l.combinedPriorityScore}/100
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold border ${
                                l.confidence === 'high'
                                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                  : l.confidence === 'medium'
                                  ? 'text-blue-400 bg-blue-500/10 border-blue-500/30'
                                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              }`}
                            >
                              {l.confidence}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {l.crmLeadId ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Promoted
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-500">Unconverted</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleViewDetail(l.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                              >
                                Detail
                              </button>
                              {!l.crmLeadId && (
                                <button
                                  onClick={async () => {
                                    // Fetch full detail then open convert modal
                                    const res = await fetch(`${apiUrl}/intelligence/leads/${l.id}`, {
                                      credentials: 'include',
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      handleOpenCrmModal(data.data);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-medium transition-colors shadow"
                                >
                                  CRM <ArrowRightCircle className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Info className="w-5 h-5 text-slate-600 mb-1" />
                            <span className="font-medium text-slate-400">No leads match the specified criteria.</span>
                            <span className="text-[11px] text-slate-500">Try adjusting your search filters or discover new businesses.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalLeads > limit && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
                  <div>
                    Showing <span className="text-white font-medium">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="text-white font-medium">{Math.min(page * limit, totalLeads)}</span> of{' '}
                    <span className="text-white font-medium">{totalLeads}</span> leads
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-medium transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page * limit >= totalLeads}
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Background Analysis & Qualification Jobs */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Recent Background Jobs
                </h3>
                <button
                  onClick={() => fetchJobs()}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                  title="Refresh jobs"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingJobs ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-3">
                {recentJobs.length > 0 ? (
                  recentJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${getJobStatusBadge(
                            j.status
                          )}`}
                        >
                          {j.status}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(j.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="font-medium text-white truncate" title={j.targetUrl}>
                        {j.targetUrl.replace(/^https?:\/\//, '')}
                      </div>
                      {j.status === 'completed' && j.opportunityScore !== undefined && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                          <span>Opportunity Score</span>
                          <span className="font-bold text-orange-400">{j.opportunityScore}/100</span>
                        </div>
                      )}
                      {j.status === 'failed' && j.errorMessage && (
                        <div className="text-[10px] text-rose-400 pt-1 border-t border-slate-900 truncate" title={j.errorMessage}>
                          {j.errorMessage}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No background jobs recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lead Detail Modal / Inspector Drawer */}
        {selectedLeadId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 shadow-2xl text-slate-200">
              {loadingDetail ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 text-orange-500 animate-spin mx-auto mb-2" />
                  <span>Loading full lead intelligence audit...</span>
                </div>
              ) : leadDetail ? (
                <div>
                  {/* Modal Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusBadge(
                            leadDetail.qualificationStatus
                          )}`}
                        >
                          {leadDetail.qualificationStatus || 'QUALIFIED'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold border ${getPriorityBadge(
                            leadDetail.priority
                          )}`}
                        >
                          {leadDetail.priority}
                        </span>
                        <span className="text-xs text-slate-400 uppercase font-mono">
                          Confidence: {leadDetail.confidence}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white">{leadDetail.businessName}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {leadDetail.industry} • {leadDetail.country} • Analyzed on{' '}
                        {new Date(leadDetail.analyzedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!leadDetail.crmLeadId && (
                        <button
                          onClick={() => handleOpenCrmModal(leadDetail)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white shadow transition-colors"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          Convert to CRM
                        </button>
                      )}
                      <button
                        onClick={handleRescore}
                        disabled={rescoring}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${rescoring ? 'animate-spin' : ''}`} />
                        Re-evaluate
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLeadId(null);
                          setLeadDetail(null);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* 3 Metric Score Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                      <div className="text-xs text-slate-400 uppercase font-semibold">
                        Website Opportunity
                      </div>
                      <div className="text-2xl font-bold text-orange-400 mt-1">
                        {leadDetail.websiteOpportunityScore}
                        <span className="text-xs font-normal text-slate-500">/100 (50% wt)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Technical defects, availability & SEO gaps
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                      <div className="text-xs text-slate-400 uppercase font-semibold">Business Fit</div>
                      <div className="text-2xl font-bold text-purple-400 mt-1">
                        {leadDetail.businessFitScore}
                        <span className="text-xs font-normal text-slate-500">/100 (35% wt)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Target market tier and contact reachability
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                      <div className="text-xs text-slate-400 uppercase font-semibold">
                        Qualification Score
                      </div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">
                        {leadDetail.qualificationScore ?? leadDetail.combinedPriorityScore}
                        <span className="text-xs font-normal text-slate-500">/100</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Comprehensive agency commercial qualification
                      </p>
                    </div>
                  </div>

                  {/* Commercial Pitch & Service Opportunity */}
                  <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/30 mb-6">
                    <div className="flex items-center gap-2 text-orange-400 font-bold text-sm mb-2">
                      <Lightbulb className="w-4 h-4" />
                      Recommended Offer: {leadDetail.recommendation?.recommendedService || 'Corporate Website Redesign'}
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      <span className="text-orange-300 font-semibold">Suggested Commercial Pitch Angle: </span>
                      {leadDetail.commercialPitchAngle || leadDetail.recommendation?.suggestedOutreachAngle}
                    </div>
                  </div>

                  {/* Domain Validation Telemetry */}
                  {leadDetail.domainAssociation && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Domain & Verification Analysis
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Domain Type</span>
                          <span className="text-white font-medium">{leadDetail.domainAssociation.domainType}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Parked Domain</span>
                          <span className={leadDetail.domainAssociation.isParked ? 'text-rose-400' : 'text-emerald-400 font-medium'}>
                            {leadDetail.domainAssociation.isParked ? 'YES (Parked)' : 'NO (Active)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Official Candidate</span>
                          <span className="text-white font-medium">
                            {leadDetail.domainAssociation.isOfficialCandidate ? 'Verified' : 'Unconfirmed'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Free Provider</span>
                          <span className="text-white font-medium">
                            {leadDetail.domainAssociation.isFreeEmailProvider ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Supporting Evidence and Missing Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Supporting Evidence
                      </h3>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {(leadDetail.qualificationEvidence || leadDetail.recommendation?.supportingEvidence || []).map(
                          (ev, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>{ev}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing Information
                      </h3>
                      <ul className="space-y-1 text-xs text-slate-400">
                        {leadDetail.missingInformation?.map((mi, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{mi}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Technical & SEO Findings */}
                  {leadDetail.findings && leadDetail.findings.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                        Technical & SEO Defect Findings ({leadDetail.findings.length})
                      </h3>
                      <div className="space-y-2">
                        {leadDetail.findings.map((f, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                    f.severity === 'high'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-orange-500/20 text-orange-300'
                                  }`}
                                >
                                  {f.severity}
                                </span>
                                <span className="text-xs font-semibold text-white">{f.title}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{f.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-rose-400 text-xs">
                  {detailError || 'Failed to display lead intelligence details.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CRM Promotion Modal */}
        {showCrmModal && convertingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-6 shadow-2xl text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                  Promote Lead to CRM Pipeline
                </h3>
                <button
                  onClick={() => setShowCrmModal(false)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleExecuteCrmConvert} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Prospect Business</label>
                  <div className="text-sm font-bold text-white">{convertingLead.businessName}</div>
                  <div className="text-slate-400">{convertingLead.industry} • {convertingLead.country}</div>
                </div>

                {/* Qualification Summary Box */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-white">{convertingLead.qualificationStatus || 'QUALIFIED'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Score:</span>
                    <span className="font-bold text-emerald-400">{convertingLead.qualificationScore ?? convertingLead.combinedPriorityScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="font-bold uppercase text-white">{convertingLead.confidence}</span>
                  </div>
                </div>

                {/* Compliance Warning */}
                <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300 text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Compliance & Consent Notice:</strong> Promoting a prospect creates a CRM Lead and Note records. It does not imply marketing consent and does not initiate cold email contact.
                  </div>
                </div>

                {/* Manual Confidence Override (Only shown to authorized roles or when review needed) */}
                {(convertingLead.qualificationStatus === 'REVIEW_NEEDED' || convertingLead.confidence === 'low') && (
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Manual Confidence Override Required</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      This lead has a confidence level of <strong>{convertingLead.confidence}</strong> or requires manual review.
                    </p>

                    {canOverrideConfidence ? (
                      <div className="space-y-2 pt-1">
                        <label className="flex items-center gap-2 text-white font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={overrideConfidence}
                            onChange={(e) => setOverrideConfidence(e.target.checked)}
                            className="rounded bg-slate-950 border-slate-700 text-orange-500 focus:ring-orange-500"
                          />
                          Authorize confidence override as Administrator
                        </label>
                        {overrideConfidence && (
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Mandatory Override Reason:
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Verified genuine local branch via registry"
                              value={overrideReason}
                              onChange={(e) => setOverrideReason(e.target.value)}
                              className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-rose-300 bg-rose-950/50 p-2 rounded border border-rose-800/50">
                        Your account role ({userRole}) is not authorized to override confidence. Please request a workspace administrator or owner to approve this conversion.
                      </div>
                    )}
                  </div>
                )}

                {/* Error Banner */}
                {crmError && (
                  <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{crmError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {crmSuccess && (
                  <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{crmSuccess.message}</span>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCrmModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={crmConverting || !!crmSuccess}
                    className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold transition-colors flex items-center gap-1.5 shadow"
                  >
                    {crmConverting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Confirm Promotion
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
