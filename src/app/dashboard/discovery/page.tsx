'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Search,
  Globe,
  Download,
  Upload,
  RefreshCw,
  XCircle,
  ExternalLink,
  MapPin,
  Building,
  CheckCircle2,
  Phone,
  Mail,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
  Flame,
  ShieldCheck,
  Compass,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Database,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  BusinessSummary,
  DiscoveryJobSummary,
  SupportedCountryCode,
  SupportedIndustry,
} from '@clienthunt/shared';

const COUNTRIES: { code: SupportedCountryCode; label: string; flag: string }[] = [
  { code: 'us', label: 'United States', flag: '🇺🇸' },
  { code: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'ca', label: 'Canada', flag: '🇨🇦' },
  { code: 'au', label: 'Australia', flag: '🇦🇺' },
];

const INDUSTRIES: { id: SupportedIndustry; label: string }[] = [
  { id: 'Consulting', label: 'Boutique & Management Consulting (ArifTech Primary)' },
  { id: 'IT Services', label: 'IT Services & Software Agencies' },
  { id: 'Accounting', label: 'Accounting & CPA Advisory' },
  { id: 'Real Estate', label: 'Real Estate & Property Management' },
  { id: 'Construction', label: 'Construction & Contractors' },
  { id: 'Cleaning Services', label: 'Commercial & Facility Services' },
];

export default function LeadDiscoveryPage() {
  const { activeWorkspace, csrfToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Search filter states
  const [country, setCountry] = useState<SupportedCountryCode>('us');
  const [state, setState] = useState('TX');
  const [city, setCity] = useState('Plano');
  const [industry, setIndustry] = useState<SupportedIndustry>('Consulting');
  const [keywords, setKeywords] = useState('');
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'with_website' | 'without_website'>('with_website');
  const [sourceProvider, setSourceProvider] = useState('osm_nominatim');

  // Search execution & progress states
  const [isSearching, setIsSearching] = useState(false);
  const [activeJob, setActiveJob] = useState<DiscoveryJobSummary | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  // Results & History states
  const [results, setResults] = useState<BusinessSummary[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [tableSearch, setTableSearch] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);

  const [jobsHistory, setJobsHistory] = useState<DiscoveryJobSummary[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // CSV Import Modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const activePollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch results table
  const fetchResults = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoadingResults(true);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: tableSearch,
      });
      const res = await fetch(`${apiUrl}/discovery/results?${q.toString()}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setResults(body.data.businesses || []);
          setTotalResults(body.data.total || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load discovery results', err);
    } finally {
      setLoadingResults(false);
    }
  }, [activeWorkspace, apiUrl, page, limit, tableSearch]);

  // Fetch jobs history
  const fetchJobs = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoadingJobs(true);
    try {
      const res = await fetch(`${apiUrl}/discovery/jobs`, { credentials: 'include' });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setJobsHistory(body.data.jobs || []);
        }
      }
    } catch (err) {
      console.error('Failed to load discovery jobs', err);
    } finally {
      setLoadingJobs(false);
    }
  }, [activeWorkspace, apiUrl]);

  useEffect(() => {
    void fetchResults();
    void fetchJobs();
  }, [fetchResults, fetchJobs]);

  // Poll active job status
  const startJobPolling = useCallback(
    (jobId: string) => {
      if (activePollingRef.current) clearInterval(activePollingRef.current);

      activePollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${apiUrl}/discovery/jobs/${jobId}`, { credentials: 'include' });
          if (!res.ok) return;
          const body = await res.json();
          if (body.success && body.data?.job) {
            const currentJob: DiscoveryJobSummary = body.data.job;
            setActiveJob(currentJob);

            if (
              currentJob.status === 'completed' ||
              currentJob.status === 'failed' ||
              currentJob.status === 'cancelled'
            ) {
              if (activePollingRef.current) clearInterval(activePollingRef.current);
              activePollingRef.current = null;
              setIsSearching(false);
              void fetchResults();
              void fetchJobs();
              if (currentJob.status === 'completed') {
                setSearchSuccess(
                  `Discovery completed! Found ${currentJob.foundCount} businesses, saved ${currentJob.savedCount} new records (${currentJob.duplicateCount} duplicates skipped).`
                );
              } else if (currentJob.status === 'failed') {
                setSearchError(currentJob.errorMessage || 'Discovery job failed to complete.');
              }
            }
          }
        } catch (err) {
          console.error('Failed polling job', err);
        }
      }, 2000);
    },
    [apiUrl, fetchResults, fetchJobs]
  );

  useEffect(() => {
    return () => {
      if (activePollingRef.current) clearInterval(activePollingRef.current);
    };
  }, []);

  // Initiate discovery search
  const handleStartSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csrfToken || !city.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchSuccess(null);
    setActiveJob(null);

    try {
      const res = await fetch(`${apiUrl}/discovery/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          country,
          state: state.trim() || undefined,
          city: city.trim(),
          industry,
          keywords: keywords.trim() || undefined,
          websiteFilter,
          sourceProvider,
        }),
        credentials: 'include',
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        setSearchError(body.error?.message || 'Failed to start discovery search');
        setIsSearching(false);
        return;
      }

      const jobId = body.data?.jobId;
      if (jobId) {
        startJobPolling(jobId);
        void fetchJobs();
      }
    } catch {
      setSearchError('Connection error to discovery service');
      setIsSearching(false);
    }
  };

  // Cancel Job
  const handleCancelJob = async (jobId: string) => {
    if (!csrfToken) return;
    try {
      const res = await fetch(`${apiUrl}/discovery/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken },
        credentials: 'include',
      });
      if (res.ok) {
        if (activeJob?.id === jobId) {
          setActiveJob((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
          setIsSearching(false);
        }
        void fetchJobs();
      }
    } catch (err) {
      console.error('Failed to cancel job', err);
    }
  };

  // Retry Job
  const handleRetryJob = async (jobId: string) => {
    if (!csrfToken) return;
    try {
      const res = await fetch(`${apiUrl}/discovery/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken },
        credentials: 'include',
      });
      if (res.ok) {
        setIsSearching(true);
        startJobPolling(jobId);
        void fetchJobs();
      }
    } catch (err) {
      console.error('Failed to retry job', err);
    }
  };

  const handleExportCsv = () => {
    window.open(`${apiUrl}/discovery/export`, '_blank');
  };

  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csrfToken || !importCsvText.trim()) return;

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await fetch(`${apiUrl}/discovery/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ csvText: importCsvText.trim() }),
        credentials: 'include',
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        setImportError(body.error?.message || 'CSV import failed');
        return;
      }

      setImportResult({
        imported: body.data.imported || 0,
        duplicates: body.data.duplicates || 0,
      });
      void fetchResults();
    } catch {
      setImportError('Failed to upload CSV file');
    } finally {
      setImporting(false);
    }
  };

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
                  <Compass className="w-3.5 h-3.5 text-[#FF8A3D]" />
                  Zero-Cost Discovery Engine
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Legal OSM Nominatim API
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
                  Lead Discovery &amp; Market Intelligence
                </h1>
                <p className="text-sm text-[#A6B2C3] mt-1.5 leading-relaxed">
                  Automated B2B business discovery across US, UK, Canada, and Australia with domain deduplication, phone/email capture, and zero paid API dependencies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#718096]">
                <div className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-[#A6B2C3]">{totalResults} Verified Businesses in Workspace</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#FF8A3D]" />
                  <span className="text-[#A6B2C3]">Active Target: US Consulting ($750 Scope)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
              <button
                onClick={() => setImportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#1C293B] hover:bg-[#243447] border border-[#2D3E53] text-[#F8FAFC] font-semibold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                Import CSV
              </button>
              <button
                onClick={handleExportCsv}
                className="px-4 py-2.5 rounded-xl bg-[#151F30] hover:bg-[#1C293B] border border-[#243447] text-[#A6B2C3] hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {searchSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-medium">{searchSuccess}</span>
          </div>
        )}
        {searchError && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="font-medium">{searchError}</span>
          </div>
        )}

        {/* Active Job Progress Banner */}
        {isSearching && activeJob && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#131D2D] via-[#1A263B] to-[#131D2D] border border-[#FF8A3D]/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#FF8A3D]/20 text-[#FF8A3D]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                    Discovery Search In Progress
                  </h3>
                  <p className="text-xs text-[#A6B2C3] font-mono">
                    [{activeJob.country.toUpperCase()}] {activeJob.industry} in {activeJob.city}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCancelJob(activeJob.id)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-950/70 border border-red-800 text-red-300 hover:bg-red-900 transition flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Job
              </button>
            </div>

            <div className="w-full bg-[#0B1120] rounded-full h-2.5 overflow-hidden border border-[#243447]">
              <div
                className="bg-gradient-to-r from-[#FF8A3D] to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(12, activeJob.progressPercent || 25)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#A6B2C3] font-mono pt-1">
              <span>Status: <strong className="text-white uppercase">{activeJob.status}</strong></span>
              <span>
                Found: <strong className="text-white">{activeJob.foundCount || 0}</strong> | Saved:{' '}
                <strong className="text-emerald-400">{activeJob.savedCount || 0}</strong> | Duplicates:{' '}
                <strong className="text-amber-400">{activeJob.duplicateCount || 0}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Discovery Filter & Search Hub */}
        <div className="rounded-3xl bg-[#151F30] border border-[#243447] p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FF8A3D]/10 text-[#FF8A3D] border border-[#FF8A3D]/20">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#F8FAFC]">Search Target Parameters</h2>
                <p className="text-xs text-[#A6B2C3]">Configure geolocation, industry category, and domain criteria.</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[#718096] hidden sm:inline">
              Rate Limit: 1 req/sec (Fair Use)
            </span>
          </div>

          <form onSubmit={handleStartSearch} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Target Country */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A6B2C3]">
                  Target Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as SupportedCountryCode)}
                  className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white focus:outline-none focus:border-[#FF8A3D] transition"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Industry */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A6B2C3]">
                  Industry / Target Niche
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as SupportedIndustry)}
                  className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white focus:outline-none focus:border-[#FF8A3D] transition"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A6B2C3]">
                  City / Locality *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plano, Dallas, Houston"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white placeholder-[#718096] focus:outline-none focus:border-[#FF8A3D] transition"
                />
              </div>

              {/* State / Province */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A6B2C3]">
                  State / Province (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TX, GA, NY, CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white placeholder-[#718096] focus:outline-none focus:border-[#FF8A3D] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#1E293B]">
              {/* Additional Keywords */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A6B2C3]">
                  Keywords / Trade (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. management, advisory, strategy"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white placeholder-[#718096] focus:outline-none focus:border-[#FF8A3D] transition"
                />
              </div>

              {/* Website Availability Filter */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A6B2C3]">
                  Website Status Filter
                </label>
                <select
                  value={websiteFilter}
                  onChange={(e) =>
                    setWebsiteFilter(e.target.value as 'all' | 'with_website' | 'without_website')
                  }
                  className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white focus:outline-none focus:border-[#FF8A3D] transition"
                >
                  <option value="with_website">Must Have Website URL (Recommended for Audits)</option>
                  <option value="all">All Businesses (With or Without Website)</option>
                  <option value="without_website">Missing Website Only (New Web Build Pitch)</option>
                </select>
              </div>

              {/* Data Provider */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#A6B2C3]">
                  Discovery Provider
                </label>
                <select
                  value={sourceProvider}
                  onChange={(e) => setSourceProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white focus:outline-none focus:border-[#FF8A3D] transition"
                >
                  <option value="osm_nominatim">OpenStreetMap Nominatim (Free &amp; Verified)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#1E293B]">
              <div className="text-xs text-[#A6B2C3] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Workspace deduplication active: existing leads are automatically recognized and updated.
                </span>
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] hover:brightness-110 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF8A3D]/25 transition disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Searching OSM...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Run Lead Discovery
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Discovery Results Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Discovered Businesses</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1C293B] text-[#A6B2C3] border border-[#2D3E53]">
                  {totalResults} Total
                </span>
              </h2>
              <p className="text-xs text-[#A6B2C3]">
                Verified real-world business records stored with domain normalization.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#718096] absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by name, domain, city..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3.5 py-2 bg-[#151F30] border border-[#243447] rounded-xl text-xs text-white placeholder-[#718096] focus:outline-none focus:border-[#FF8A3D] transition"
                />
              </div>
              <button
                onClick={() => void fetchResults()}
                className="p-2 rounded-xl bg-[#151F30] border border-[#243447] text-[#A6B2C3] hover:text-white hover:border-[#FF8A3D]/40 transition cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-[#151F30] border border-[#243447] overflow-hidden shadow-xl">
            {loadingResults ? (
              <div className="py-20 text-center text-[#A6B2C3] text-xs space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FF8A3D]" />
                <p>Loading discovered business records...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Globe className="w-10 h-10 text-[#718096] mx-auto" />
                <p className="text-sm font-semibold text-white">No discovered businesses found</p>
                <p className="text-xs text-[#A6B2C3] max-w-sm mx-auto">
                  Run a discovery search using the filters above or import a CSV file to populate target businesses.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#A6B2C3]">
                  <thead className="bg-[#111827] text-[11px] uppercase font-bold text-[#718096] border-b border-[#1E293B]">
                    <tr>
                      <th className="px-6 py-4">Business &amp; Domain</th>
                      <th className="px-6 py-4">Industry / Niche</th>
                      <th className="px-6 py-4">Website Status</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Public Contact</th>
                      <th className="px-6 py-4">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {results.map((b) => (
                      <tr key={b.id} className="hover:bg-[#182337]/60 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white flex items-center gap-1.5 text-sm">
                            <Building className="w-4 h-4 text-[#FF8A3D] shrink-0" />
                            {b.name}
                          </div>
                          {b.websiteUrl ? (
                            <a
                              href={b.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 mt-1"
                            >
                              {b.normalizedDomain || b.websiteUrl}{' '}
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-[#718096] font-mono italic mt-1 block">
                              No website discovered
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#1C293B] border border-[#2D3E53] text-[#F8FAFC]">
                            {b.industry}
                          </span>
                          {b.category && (
                            <div className="text-[11px] text-[#718096] mt-1">{b.category}</div>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase font-semibold ${
                              b.websiteStatus === 'available'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-[#1C293B] text-[#A6B2C3] border border-[#2D3E53]'
                            }`}
                          >
                            {b.websiteStatus}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-[#F8FAFC]">
                            <MapPin className="w-3.5 h-3.5 text-[#718096] shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {b.city}
                              {b.region ? `, ${b.region}` : ''}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#718096] uppercase mt-1">
                            {b.countryCode}
                          </div>
                        </td>

                        <td className="px-6 py-4 space-y-1">
                          {b.publicEmail ? (
                            <div className="flex items-center gap-1.5 text-xs text-[#F8FAFC]">
                              <Mail className="w-3.5 h-3.5 text-[#FF8A3D] shrink-0" />
                              <span className="font-mono">{b.publicEmail}</span>
                            </div>
                          ) : null}
                          {b.publicPhone ? (
                            <div className="flex items-center gap-1.5 text-xs text-[#F8FAFC]">
                              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-mono">{b.publicPhone}</span>
                            </div>
                          ) : null}
                          {!b.publicEmail && !b.publicPhone && (
                            <span className="text-[11px] text-[#718096] italic">None public</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-[#A6B2C3]">
                            {b.sourceProvider}
                          </span>
                          <div className="text-[11px] text-[#718096] mt-0.5">
                            {new Date(b.discoveryTimestamp).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="px-6 py-3.5 border-t border-[#1E293B] flex items-center justify-between text-xs text-[#A6B2C3] bg-[#111827]/40">
              <span>
                Showing {results.length} of {totalResults} businesses
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-[#1C293B] hover:bg-[#243447] text-white border border-[#2D3E53] disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="font-mono px-2">Page {page}</span>
                <button
                  disabled={results.length < limit}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-[#1C293B] hover:bg-[#243447] text-white border border-[#2D3E53] disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Job History */}
        <div className="space-y-4 pt-4 border-t border-[#1E293B]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Recent Discovery Jobs
              </h3>
              <p className="text-xs text-[#A6B2C3]">
                Audit log of background discovery runs with retry and status tracking.
              </p>
            </div>
            <button
              onClick={() => void fetchJobs()}
              className="text-xs font-semibold text-[#FF8A3D] hover:text-[#FF9B57] flex items-center gap-1 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Jobs
            </button>
          </div>

          <div className="rounded-3xl bg-[#151F30] border border-[#243447] overflow-hidden shadow-xl">
            {loadingJobs ? (
              <div className="p-8 text-center text-xs text-[#A6B2C3]">Loading job history...</div>
            ) : jobsHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#718096]">
                No discovery jobs recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-[#1E293B]">
                {jobsHistory.map((j) => (
                  <div
                    key={j.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#182337]/40 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold border ${
                            j.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : j.status === 'processing'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                                : j.status === 'failed'
                                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                  : 'bg-[#1C293B] text-[#A6B2C3] border-[#2D3E53]'
                          }`}
                        >
                          {j.status}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          [{j.country.toUpperCase()}] {j.industry} in {j.city}
                        </span>
                        {j.keywords && (
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1C293B] border border-[#2D3E53] text-[#A6B2C3] rounded-md">
                            {j.keywords}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#A6B2C3]">
                        Provider: <span className="font-mono">{j.sourceProvider}</span> | Found:{' '}
                        <strong className="text-white">{j.foundCount || 0}</strong> | Saved:{' '}
                        <strong className="text-emerald-400">{j.savedCount || 0}</strong> | Duplicates:{' '}
                        <strong className="text-amber-400">{j.duplicateCount || 0}</strong>
                      </div>
                      {j.errorMessage && (
                        <div className="text-xs text-red-400 font-mono">{j.errorMessage}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {j.status === 'processing' && (
                        <button
                          onClick={() => handleCancelJob(j.id)}
                          className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/30 rounded-lg border border-red-900/40 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      {(j.status === 'failed' || j.status === 'cancelled') && (
                        <button
                          onClick={() => handleRetryJob(j.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#FF8A3D] hover:bg-[#FF8A3D]/10 rounded-lg border border-[#FF8A3D]/30 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CSV Import Modal */}
        {importModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-[#151F30] border border-[#243447] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#FF8A3D]/10 text-[#FF8A3D] border border-[#FF8A3D]/20">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Import Business Leads CSV</h3>
                </div>
                <button
                  onClick={() => setImportModalOpen(false)}
                  className="text-[#718096] hover:text-white transition text-lg"
                >
                  &times;
                </button>
              </div>

              <p className="text-xs text-[#A6B2C3] leading-relaxed">
                Paste CSV content with headers:{' '}
                <code className="text-[#FF8A3D] bg-[#0B1120] px-1.5 py-0.5 rounded border border-[#243447]">
                  name,websiteUrl,industry,city,countryCode,publicPhone,publicEmail
                </code>
                . Records are verified, normalized, and deduplicated against this workspace.
              </p>

              {importResult && (
                <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Imported {importResult.imported} new records ({importResult.duplicates} duplicates merged).
                  </span>
                </div>
              )}
              {importError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              <form onSubmit={handleImportCsv} className="space-y-4">
                <textarea
                  rows={8}
                  required
                  placeholder={`name,websiteUrl,industry,city,countryCode,publicPhone\nAcme Roofing,https://acmeroofing.com,Construction,Chicago,us,+1-312-555-0199`}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  className="w-full p-3.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs font-mono text-white placeholder-[#718096] focus:outline-none focus:border-[#FF8A3D] transition"
                />

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#A6B2C3] hover:text-white transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={importing}
                    className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] hover:brightness-110 text-white rounded-xl shadow-md shadow-[#FF8A3D]/20 disabled:opacity-50 transition cursor-pointer active:scale-95"
                  >
                    {importing ? 'Importing...' : 'Parse & Import CSV'}
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
