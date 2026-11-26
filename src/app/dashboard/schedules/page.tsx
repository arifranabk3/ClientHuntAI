'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Calendar,
  Clock,
  Play,
  Pause,
  Plus,
  RefreshCw,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  ChevronRight,
  X,
  Globe,
  Sliders,
} from 'lucide-react';

interface ScheduleItem {
  id: string;
  workspaceId: string;
  scheduleName: string;
  scheduleType: 'recurring' | 'one_time';
  jobType: string;
  enabled: boolean;
  timezone: string;
  frequency: string;
  interval?: number;
  daysOfWeek?: number[];
  localTime?: string;
  nextRunAt: string;
  lastRunAt?: string;
  lastRunStatus?: string;
  lastRunError?: string;
  totalRunsCount: number;
}

interface ExecutionLogItem {
  id: string;
  jobType: string;
  status: string;
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  itemsProcessed?: number;
  summaryMessage?: string;
  errorMessage?: string;
}

export default function SchedulesPage() {
  const { activeWorkspace, csrfToken } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formJobType, setFormJobType] = useState('LEAD_DISCOVERY');
  const [formFrequency, setFormFrequency] = useState('daily');
  const [formLocalTime, setFormLocalTime] = useState('09:00');
  const [formTimezone, setFormTimezone] = useState('America/New_York');
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default

  // History Drawer / Modal
  const [selectedHistorySchedule, setSelectedHistorySchedule] = useState<ScheduleItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ExecutionLogItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const loadSchedules = async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/schedules`, {
        credentials: 'include',
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setSchedules(d.data.schedules || []);
      } else {
        setError('Failed to fetch workspace schedules');
      }
    } catch {
      setError('Network error loading schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedules();
  }, [activeWorkspace]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingScheduleId(null);
    setFormName('');
    setFormJobType('LEAD_DISCOVERY');
    setFormFrequency('weekdays');
    setFormLocalTime('09:00');
    setFormTimezone('America/New_York');
    setFormDaysOfWeek([1, 2, 3, 4, 5]);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (s: ScheduleItem) => {
    setEditingScheduleId(s.id);
    setFormName(s.scheduleName);
    setFormJobType(s.jobType);
    setFormFrequency(s.frequency);
    setFormLocalTime(s.localTime || '09:00');
    setFormTimezone(s.timezone || 'UTC');
    setFormDaysOfWeek(s.daysOfWeek || []);
    setIsModalOpen(true);
  };

  // Submit Create / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !formName.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        scheduleName: formName.trim(),
        jobType: formJobType,
        frequency: formFrequency,
        localTime: formLocalTime,
        timezone: formTimezone,
        daysOfWeek: formFrequency === 'weekly' ? formDaysOfWeek : [],
      };

      const url = editingScheduleId
        ? `${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/schedules/${editingScheduleId}`
        : `${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/schedules`;

      const method = editingScheduleId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        await loadSchedules();
      } else {
        const body = await res.json();
        alert(body.error?.message || 'Error saving schedule');
      }
    } catch {
      alert('Network error saving schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Pause / Resume
  const handleTogglePause = async (s: ScheduleItem) => {
    if (!activeWorkspace) return;
    const action = s.enabled ? 'pause' : 'resume';
    try {
      const res = await fetch(
        `${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/schedules/${s.id}/${action}`,
        {
          method: 'POST',
          headers: {
            'X-CSRF-Token': csrfToken || '',
          },
          credentials: 'include',
        }
      );
      if (res.ok) {
        await loadSchedules();
      } else {
        const b = await res.json();
        alert(b.error?.message || `Failed to ${action} schedule`);
      }
    } catch {
      alert(`Network error toggling schedule state`);
    }
  };

  // Manual Trigger Run
  const handleManualRun = async (s: ScheduleItem) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(
        `${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/schedules/${s.id}/run`,
        {
          method: 'POST',
          headers: {
            'X-CSRF-Token': csrfToken || '',
          },
          credentials: 'include',
        }
      );
      if (res.ok) {
        alert(`Schedule "${s.scheduleName}" triggered successfully! Check execution history.`);
        await loadSchedules();
      } else {
        const b = await res.json();
        alert(b.error?.message || 'Failed to trigger schedule');
      }
    } catch {
      alert('Network error triggering schedule');
    }
  };

  // View Execution History
  const handleViewHistory = async (s: ScheduleItem) => {
    if (!activeWorkspace) return;
    setSelectedHistorySchedule(s);
    setLoadingHistory(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/schedules/${s.id}/history?limit=20`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const d = await res.json();
        if (d.success) setHistoryLogs(d.data.logs || []);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2740] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Recurring Schedule Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure and orchestrate autonomous recurring background operations for{' '}
              <span className="text-indigo-400 font-semibold">{activeWorkspace?.workspace.name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadSchedules()}
              className="flex items-center gap-2 bg-[#0c1424] hover:bg-[#131f38] border border-[#17253e] text-slate-300 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Schedule</span>
            </button>
          </div>
        </div>

        {/* Schedules Table / Card List */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading recurring workspace schedules...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/50 text-xs text-red-400">
            {error}
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-4">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white">No active schedules configured</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Create your first recurring schedule to automate lead discovery, website audits, and qualification on a set cadence.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Configure Schedule</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0c1424] border border-[#17253e] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#17253e] bg-[#070b14]/50 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Schedule Name</th>
                    <th className="py-3 px-4">Operation Type</th>
                    <th className="py-3 px-4">Cadence & Time</th>
                    <th className="py-3 px-4">Next Run</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Total Runs</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17253e]/60">
                  {schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-[#101b33]/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              s.enabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-500'
                            }`}
                          />
                          <span>{s.scheduleName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                        {s.jobType}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="space-y-0.5">
                          <div className="font-medium capitalize">{s.frequency} @ {s.localTime}</div>
                          <div className="text-[10px] text-slate-500">{s.timezone}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-indigo-300 font-mono text-[11px]">
                        {new Date(s.nextRunAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            s.enabled
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {s.enabled ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{s.totalRunsCount}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => void handleManualRun(s)}
                            title="Run Immediately"
                            className="p-1.5 rounded-lg bg-[#070b14] hover:bg-orange-500/20 text-orange-400 border border-[#17253e] hover:border-orange-500/40 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => void handleTogglePause(s)}
                            title={s.enabled ? 'Pause Schedule' : 'Resume Schedule'}
                            className="p-1.5 rounded-lg bg-[#070b14] hover:bg-slate-700 text-slate-300 border border-[#17253e] transition-colors"
                          >
                            {s.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(s)}
                            title="Edit Configuration"
                            className="p-1.5 rounded-lg bg-[#070b14] hover:bg-slate-700 text-slate-300 border border-[#17253e] transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => void handleViewHistory(s)}
                            title="Execution History"
                            className="p-1.5 rounded-lg bg-[#070b14] hover:bg-indigo-500/20 text-indigo-400 border border-[#17253e] hover:border-indigo-500/40 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0c1424] border border-[#17253e] shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#17253e] pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingScheduleId ? 'Edit Schedule' : 'Create Recurring Schedule'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Schedule Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Daily Austin Management Consulting Discovery"
                    className="w-full bg-[#070b14] border border-[#17253e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Operation Type</label>
                  <select
                    value={formJobType}
                    onChange={(e) => setFormJobType(e.target.value)}
                    className="w-full bg-[#070b14] border border-[#17253e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="LEAD_DISCOVERY">LEAD_DISCOVERY (Target Metros Discovery)</option>
                    <option value="LEAD_QUALIFICATION">LEAD_QUALIFICATION (100-pt Evidence Model)</option>
                    <option value="WEBSITE_MONITORING">WEBSITE_MONITORING (Audit Changes)</option>
                    <option value="LEAD_REQUALIFICATION">LEAD_REQUALIFICATION (Priority Refresh)</option>
                    <option value="CONTACT_VERIFICATION_REFRESH">CONTACT_VERIFICATION_REFRESH (DNS MX & Email)</option>
                    <option value="OUTREACH_DRAFT_GENERATION">OUTREACH_DRAFT_GENERATION (Personalized Drafts)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Frequency</label>
                    <select
                      value={formFrequency}
                      onChange={(e) => setFormFrequency(e.target.value)}
                      className="w-full bg-[#070b14] border border-[#17253e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="weekdays">Weekdays (Mon-Fri)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="hourly">Hourly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold">Execution Time (Local)</label>
                    <input
                      type="time"
                      value={formLocalTime}
                      onChange={(e) => setFormLocalTime(e.target.value)}
                      className="w-full bg-[#070b14] border border-[#17253e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Timezone</label>
                  <select
                    value={formTimezone}
                    onChange={(e) => setFormTimezone(e.target.value)}
                    className="w-full bg-[#070b14] border border-[#17253e] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="America/New_York">America/New_York (Eastern)</option>
                    <option value="America/Chicago">America/Chicago (Central / Texas)</option>
                    <option value="America/Denver">America/Denver (Mountain)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
                    <option value="UTC">UTC (Universal Time)</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#17253e]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-semibold shadow-lg shadow-orange-500/20"
                  >
                    {isSubmitting ? 'Saving...' : editingScheduleId ? 'Update Schedule' : 'Create Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Execution History Drawer */}
        {selectedHistorySchedule && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-end">
            <div className="w-full max-w-lg h-full bg-[#0c1424] border-l border-[#17253e] p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#17253e] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Execution History</h3>
                  <p className="text-[11px] text-slate-400">{selectedHistorySchedule.scheduleName}</p>
                </div>
                <button
                  onClick={() => setSelectedHistorySchedule(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-20 text-center text-xs text-slate-400">Loading history logs...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-20 text-center text-xs text-slate-400">No execution logs found yet.</div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#070b14] border border-[#17253e] space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold text-[11px] uppercase tracking-wider ${
                            log.status === 'completed'
                              ? 'text-emerald-400'
                              : log.status === 'failed'
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {log.status}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {log.durationMs ? `${log.durationMs}ms` : 'active'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Triggered by: <span className="font-mono text-indigo-400">{log.triggeredBy}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.startedAt).toLocaleString()}
                      </div>
                      {log.summaryMessage && (
                        <div className="text-[11px] text-slate-400 pt-1 border-t border-[#17253e]/60">
                          {log.summaryMessage}
                        </div>
                      )}
                      {log.errorMessage && (
                        <div className="text-[11px] text-red-400 pt-1 border-t border-[#17253e]/60">
                          Error: {log.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
