'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/components/AuthContext';
import {
  ShieldCheck,
  Globe,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  FileText,
  HardDrive,
  Check,
} from 'lucide-react';

interface RetentionOverview {
  summary: {
    totalWebsites: number;
    activeWebsites: number;
    overdueWebsites: number;
    pendingApprovalTasks: number;
    unverifiedBackups: number;
  };
  websites: Array<{
    _id: string;
    clientName: string;
    siteName: string;
    websiteUrl: string;
    maintenancePlan: string;
    maintenanceStatus: string;
    nextMaintenanceDueDate: string;
    isWordPress: boolean;
  }>;
  recentTasks: Array<{
    _id: string;
    title: string;
    category: string;
    priority: string;
    status: string;
    dueDate: string;
    requiresClientApproval: boolean;
  }>;
  recentBackups: Array<{
    _id: string;
    backupProvider: string;
    backupName: string;
    backupTimestamp: string;
    backupStatus: string;
    verificationStatus: string;
    evidenceReference?: string;
  }>;
  recentReports: Array<{
    _id: string;
    reportPeriod: string;
    generatedAt: string;
    websiteHealthSnapshot: {
      uptimeObservationPercent: number;
      sslStatus: string;
      httpAvailability: boolean;
    };
  }>;
}

export default function RetentionDashboardPage() {
  const { activeWorkspace, csrfToken } = useAuth();
  const [data, setData] = useState<RetentionOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'websites' | 'tasks' | 'backups' | 'reports'>('websites');

  // Form states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [clientName, setClientName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [maintenancePlan, setMaintenancePlan] = useState('standard');
  const [isWordPress, setIsWordPress] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchOverview = async () => {
    if (!activeWorkspace?.workspace?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/retention/overview`,
        { credentials: 'include' }
      );
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to load retention data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching retention overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [activeWorkspace?.workspace?.id]);

  const handleRegisterWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace?.workspace?.id) return;
    try {
      setSubmitting(true);
      const res = await fetch(
        `${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/retention/websites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken || '',
          },
          credentials: 'include',
          body: JSON.stringify({
            clientName,
            siteName,
            websiteUrl,
            maintenancePlan,
            isWordPress,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setClientName('');
        setSiteName('');
        setWebsiteUrl('');
        await fetchOverview();
      } else {
        alert(json.error?.message || 'Failed to register website');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating client website');
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
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
              Agency Client Retention & Maintenance
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Recurring website health monitoring, verified backups, task tracking, and monthly SLA reports.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchOverview}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 transition shadow"
            >
              <Plus className="w-4 h-4" /> Add Client Site
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Managed Websites
              </span>
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">
                {data?.summary.totalWebsites || 0}
              </span>
              <span className="text-xs text-emerald-400">
                {data?.summary.activeWebsites || 0} active
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Maintenance Overdue
              </span>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-300">
                {data?.summary.overdueWebsites || 0}
              </span>
              <span className="text-xs text-slate-400">sites require review</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pending Approval
              </span>
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-300">
                {data?.summary.pendingApprovalTasks || 0}
              </span>
              <span className="text-xs text-slate-400">tasks awaiting signoff</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Unverified Backups
              </span>
              <HardDrive className="w-5 h-5 text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-300">
                {data?.summary.unverifiedBackups || 0}
              </span>
              <span className="text-xs text-slate-400">needs evidence check</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('websites')}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'websites'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Client Websites ({data?.websites.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'tasks'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Maintenance Tasks ({data?.recentTasks.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('backups')}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'backups'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Backup Records ({data?.recentBackups.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'reports'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly Reports ({data?.recentReports.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading retention data...</div>
        ) : error ? (
          <div className="p-4 bg-red-950/40 border border-red-800 text-red-300 rounded-lg text-sm">
            {error}
          </div>
        ) : (
          <div>
            {activeTab === 'websites' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4">Site Name & URL</th>
                      <th className="p-4">Client</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Platform</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Next Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data?.websites.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No client websites registered yet. Click &quot;Add Client Site&quot; to begin.
                        </td>
                      </tr>
                    ) : (
                      data?.websites.map((w) => (
                        <tr key={w._id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4">
                            <div className="font-semibold text-slate-100">{w.siteName}</div>
                            <a
                              href={w.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-emerald-400 hover:underline"
                            >
                              {w.websiteUrl}
                            </a>
                          </td>
                          <td className="p-4 text-slate-200">{w.clientName}</td>
                          <td className="p-4 uppercase text-xs font-semibold text-slate-300">
                            {w.maintenancePlan}
                          </td>
                          <td className="p-4">
                            {w.isWordPress ? (
                              <span className="px-2 py-0.5 rounded text-xs bg-blue-950 text-blue-400 border border-blue-800">
                                WordPress
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">Custom / Static</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                w.maintenanceStatus === 'active'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {w.maintenanceStatus}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400 text-xs">
                            {new Date(w.nextMaintenanceDueDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4">Task</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Approval</th>
                      <th className="p-4">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data?.recentTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No maintenance tasks logged.
                        </td>
                      </tr>
                    ) : (
                      data?.recentTasks.map((t) => (
                        <tr key={t._id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-medium text-slate-200">{t.title}</td>
                          <td className="p-4 text-xs uppercase text-slate-400">{t.category}</td>
                          <td className="p-4">
                            <span className="text-xs font-semibold uppercase text-slate-300">
                              {t.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {t.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs">
                            {t.requiresClientApproval ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> Required
                              </span>
                            ) : (
                              <span className="text-slate-500">Not required</span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-slate-400">
                            {new Date(t.dueDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'backups' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4">Backup Name</th>
                      <th className="p-4">Provider</th>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Verification Status</th>
                      <th className="p-4">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data?.recentBackups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No backup records registered.
                        </td>
                      </tr>
                    ) : (
                      data?.recentBackups.map((b) => (
                        <tr key={b._id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-medium text-slate-200">{b.backupName}</td>
                          <td className="p-4 text-slate-400">{b.backupProvider}</td>
                          <td className="p-4 text-xs text-slate-400">
                            {new Date(b.backupTimestamp).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                b.verificationStatus === 'verified'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {b.verificationStatus}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-slate-400">
                            {b.evidenceReference || 'No verification evidence'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4">Period</th>
                      <th className="p-4">Uptime Observed</th>
                      <th className="p-4">SSL Status</th>
                      <th className="p-4">HTTP State</th>
                      <th className="p-4">Generated Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {data?.recentReports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No monthly reports generated yet.
                        </td>
                      </tr>
                    ) : (
                      data?.recentReports.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-semibold text-slate-100 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            {r.reportPeriod}
                          </td>
                          <td className="p-4 font-medium text-slate-200">
                            {r.websiteHealthSnapshot.uptimeObservationPercent}%
                          </td>
                          <td className="p-4 text-xs uppercase text-slate-300">
                            {r.websiteHealthSnapshot.sslStatus}
                          </td>
                          <td className="p-4">
                            {r.websiteHealthSnapshot.httpAvailability ? (
                              <span className="text-emerald-400 text-xs flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                              </span>
                            ) : (
                              <span className="text-rose-400 text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Degraded
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-xs text-slate-400">
                            {new Date(r.generatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Add Client Site */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <h2 className="text-lg font-bold text-slate-100">Register Client Website</h2>
              <form onSubmit={handleRegisterWebsite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Website Name / Title
                  </label>
                  <input
                    type="text"
                    required
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="e.g. Acme Corporate Portal"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    required
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://acme.example.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Maintenance Plan
                  </label>
                  <select
                    value={maintenancePlan}
                    onChange={(e) => setMaintenancePlan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="basic">Basic Maintenance</option>
                    <option value="standard">Standard Care</option>
                    <option value="premium">Premium Proactive</option>
                    <option value="enterprise">Enterprise Tier</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isWp"
                    checked={isWordPress}
                    onChange={(e) => setIsWordPress(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="isWp" className="text-sm text-slate-300">
                    WordPress CMS site
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {submitting ? 'Registering...' : 'Register Website'}
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
