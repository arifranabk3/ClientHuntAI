'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ShieldCheck,
  RefreshCw,
  Plus,
  Edit3,
  Calendar,
  AlertTriangle,
  Mail,
  ChevronRight,
  ExternalLink,
  UserCheck,
  Eye,
  Building,
  Target,
  Sparkles,
  Flame,
  FileText,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
  Search,
  Filter,
  Check,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import type {
  OutreachCampaignSummary,
  OutreachDraftSummary,
  SuppressionRecordSummary,
  OutreachAnalyticsSummary,
  SenderProfileSummary,
} from '@clienthunt/shared';

type TabType = 'overview' | 'drafts' | 'followups' | 'sender_profiles' | 'campaigns' | 'suppression';

export default function OutreachDashboardPage() {
  const { csrfToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const [activeTab, setActiveTab] = useState<TabType>('drafts');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<OutreachAnalyticsSummary | null>(null);

  // Campaigns State
  const [campaigns, setCampaigns] = useState<OutreachCampaignSummary[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [newCampaignModal, setNewCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    targetService: 'Corporate Website Development & Redesign',
    minPriority: 'Medium Priority',
  });

  // Drafts State
  const [drafts, setDrafts] = useState<OutreachDraftSummary[]>([]);
  const [draftFilterStatus, setDraftFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDraft, setSelectedDraft] = useState<OutreachDraftSummary | null>(null);
  const [editingDraft, setEditingDraft] = useState<OutreachDraftSummary | null>(null);
  const [generateModal, setGenerateModal] = useState(false);
  const [genPitchType, setGenPitchType] = useState('first_contact');

  // Suppression State
  const [suppressions, setSuppressions] = useState<SuppressionRecordSummary[]>([]);
  const [suppressModal, setSuppressModal] = useState(false);
  const [suppressEmail, setSuppressEmail] = useState('');
  const [suppressReason, setSuppressReason] = useState('unsubscribe_request');

  // Sender Profiles State
  const [senderProfiles, setSenderProfiles] = useState<SenderProfileSummary[]>([]);
  const [profileModal, setProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    senderName: '',
    senderEmail: '',
    senderTitle: '',
    companyName: '',
    physicalAddress: '',
    isDefault: true,
  });

  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/outreach/analytics`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setAnalytics(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [apiUrl]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/outreach/campaigns?limit=50`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const loadedCampaigns = json.data.campaigns || [];
        setCampaigns(loadedCampaigns);
        if (loadedCampaigns.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(loadedCampaigns[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [apiUrl, selectedCampaignId]);

  const fetchDrafts = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${apiUrl}/outreach/drafts?limit=50`;
      if (selectedCampaignId) url += `&campaignId=${selectedCampaignId}`;
      if (draftFilterStatus !== 'all') url += `&status=${draftFilterStatus}`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const loadedDrafts = json.data.drafts || [];
        setDrafts(loadedDrafts);
        if (!selectedDraft && loadedDrafts.length > 0) {
          setSelectedDraft(loadedDrafts[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, selectedCampaignId, draftFilterStatus, selectedDraft]);

  const fetchSuppressions = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/outreach/suppression?limit=50`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setSuppressions(json.data.records || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [apiUrl]);

  const fetchSenderProfiles = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/outreach/sender-profiles`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setSenderProfiles(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAnalytics();
    fetchCampaigns();
    fetchSenderProfiles();
  }, [fetchAnalytics, fetchCampaigns, fetchSenderProfiles]);

  useEffect(() => {
    if (activeTab === 'drafts' || activeTab === 'followups') {
      fetchDrafts();
    } else if (activeTab === 'suppression') {
      fetchSuppressions();
    } else if (activeTab === 'sender_profiles') {
      fetchSenderProfiles();
    }
  }, [activeTab, fetchDrafts, fetchSuppressions, fetchSenderProfiles]);

  const handleCreateSenderProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/outreach/sender-profiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        credentials: 'include',
        body: JSON.stringify(profileForm),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setActionMessage({ type: 'success', text: 'Sender profile created successfully with verified physical address.' });
        setProfileModal(false);
        setProfileForm({
          senderName: '',
          senderEmail: '',
          senderTitle: '',
          companyName: '',
          physicalAddress: '',
          isDefault: true,
        });
        fetchSenderProfiles();
      } else {
        setActionMessage({ type: 'error', text: json.error?.message || 'Failed to create sender profile' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Network error creating sender profile' });
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/outreach/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        credentials: 'include',
        body: JSON.stringify(campaignForm),
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Campaign "${campaignForm.name}" created successfully!`,
        });
        setNewCampaignModal(false);
        setCampaignForm({
          name: '',
          description: '',
          targetService: 'Corporate Website Development & Redesign',
          minPriority: 'Medium Priority',
        });
        fetchCampaigns();
      } else {
        setActionMessage({
          type: 'error',
          text: json.error?.message || 'Failed to create campaign',
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionMessage({ type: 'error', text: msg });
    }
  };

  const handleGenerateDrafts = async () => {
    if (!selectedCampaignId) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/outreach/drafts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        credentials: 'include',
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          pitchType: genPitchType,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Generated ${json.data.generated} personalized drafts (${json.data.suppressedCount} suppressed leads safely skipped).`,
        });
        setGenerateModal(false);
        fetchDrafts();
        fetchAnalytics();
      } else {
        setActionMessage({ type: 'error', text: json.error?.message || 'Generation failed' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDraft = async (draftId: string) => {
    try {
      const res = await fetch(`${apiUrl}/outreach/drafts/${draftId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Draft approved for manual outreach (No automatic sending).' });
        fetchDrafts();
        fetchAnalytics();
        if (selectedDraft?.id === draftId) {
          setSelectedDraft(prev => prev ? { ...prev, status: 'approved' } : null);
        }
      } else {
        setActionMessage({ type: 'error', text: json.error?.message || 'Approval failed' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionMessage({ type: 'error', text: msg });
    }
  };

  const handleMarkSent = async (draftId: string) => {
    try {
      const res = await fetch(`${apiUrl}/outreach/drafts/${draftId}/mark-sent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        credentials: 'include',
        body: JSON.stringify({
          notes: 'Sent manually via corporate email client',
          followUpDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        }),
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Recorded manual email transmission. Follow-up scheduled.' });
        fetchDrafts();
        fetchAnalytics();
        if (selectedDraft?.id === draftId) {
          setSelectedDraft(prev => prev ? { ...prev, status: 'sent' } : null);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionMessage({ type: 'error', text: msg });
    }
  };

  const handleMarkReplied = async (draftId: string) => {
    try {
      const res = await fetch(`${apiUrl}/outreach/drafts/${draftId}/mark-replied`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        credentials: 'include',
        body: JSON.stringify({ notes: 'Prospect responded' }),
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Reply recorded! Lead moved to replied status and follow-ups cancelled.' });
        fetchDrafts();
        fetchAnalytics();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionMessage({ type: 'error', text: msg });
    }
  };

  const handleSaveDraft = async () => {
    if (!editingDraft) return;
    try {
      const res = await fetch(`${apiUrl}/outreach/drafts/${editingDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        credentials: 'include',
        body: JSON.stringify({
          subject: editingDraft.subject,
          body: editingDraft.body,
          recipientEmail: editingDraft.recipientEmail,
        }),
      });
      if (res.ok) {
        setActionMessage({ type: 'success', text: 'Draft updated successfully.' });
        if (selectedDraft?.id === editingDraft.id) {
          setSelectedDraft(editingDraft);
        }
        setEditingDraft(null);
        fetchDrafts();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionMessage({ type: 'error', text: msg });
    }
  };

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/outreach/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
        credentials: 'include',
        body: JSON.stringify({
          email: suppressEmail,
          reason: suppressReason,
          scope: 'workspace',
          notes: 'Manual suppression via dashboard',
        }),
      });
      if (res.ok) {
        setActionMessage({
          type: 'success',
          text: `Email ${suppressEmail} added to suppression list.`,
        });
        setSuppressModal(false);
        setSuppressEmail('');
        fetchSuppressions();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionMessage({ type: 'error', text: msg });
    }
  };

  // Filtered drafts by search
  const filteredDrafts = useMemo(() => {
    if (!searchTerm.trim()) return drafts;
    const term = searchTerm.toLowerCase();
    return drafts.filter(
      (d) =>
        d.businessName.toLowerCase().includes(term) ||
        d.recipientEmail.toLowerCase().includes(term) ||
        d.subject.toLowerCase().includes(term)
    );
  }, [drafts, searchTerm]);

  // Real Database Metrics for Overview Strip
  const overviewMetrics = useMemo(() => {
    const totalDrafts = drafts.length;
    const pendingReview = drafts.filter((d) => d.status === 'pending_review').length;
    const approved = drafts.filter((d) => d.status === 'approved').length;
    const sent = drafts.filter((d) => d.status === 'sent').length;
    const replied = drafts.filter((d) => d.status === 'replied').length;
    const followUpsDue = drafts.filter((d) => d.scheduledFollowUpDate && d.status === 'sent').length;

    return {
      totalDrafts: analytics?.draftsGenerated ?? totalDrafts,
      pendingReview: pendingReview,
      approved: analytics?.draftsApproved ?? approved,
      sent: analytics?.sentCount ?? sent,
      replied: analytics?.repliedCount ?? replied,
      followUpsDue: followUpsDue,
    };
  }, [drafts, analytics]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'sent':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'replied':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'suppressed':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'rejected':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
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
                  <Flame className="w-3.5 h-3.5 text-[#FF8A3D]" />
                  Compliant B2B Outreach Hub
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Manual Mode • Zero Auto-Sending
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
                  Outreach Intelligence &amp; Draft Approvals
                </h1>
                <p className="text-sm text-[#A6B2C3] mt-1.5 leading-relaxed">
                  Personalized cold email pitches generated directly from verified website audit findings. Full CAN-SPAM Act, CASL &amp; PECR compliance enforcement with human-in-the-loop review.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#718096]">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[#A6B2C3]">
                    {senderProfiles.length > 0 ? `Registered Sender: ${senderProfiles[0].companyName}` : 'Sender Profile Required'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#FF8A3D]" />
                  <span className="text-[#A6B2C3]">Service Scope: $750 Corporate Redesign</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
              <button
                onClick={() => setGenerateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] hover:brightness-110 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#FF8A3D]/25 transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Generate Drafts
              </button>
              <button
                onClick={() => setNewCampaignModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#1C293B] hover:bg-[#243447] border border-[#2D3E53] text-[#F8FAFC] font-semibold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-400" />
                New Campaign
              </button>
              <button
                onClick={() => {
                  fetchAnalytics();
                  fetchCampaigns();
                  fetchDrafts();
                  fetchSenderProfiles();
                }}
                className="p-2.5 rounded-xl bg-[#151F30] border border-[#243447] text-[#A6B2C3] hover:text-white transition cursor-pointer"
                title="Refresh All Outreach Telemetry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Outreach Overview (Database-Backed Metric Strip) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-[#A6B2C3]">Total Drafts</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] mt-1.5">{overviewMetrics.totalDrafts}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">In workspace</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-amber-400">Pending Review</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1.5">{overviewMetrics.pendingReview}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">Requires approval</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-emerald-400">Approved Drafts</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1.5">{overviewMetrics.approved}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">Ready to send</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-blue-400">Manually Sent</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-1.5">{overviewMetrics.sent}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">Recorded by user</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-purple-400">Replies Received</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1.5">{overviewMetrics.replied}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">Lead responses</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-[#A6B2C3]">Follow-ups Due</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] mt-1.5">{overviewMetrics.followUpsDue}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">Scheduled touchpoints</span>
          </div>
        </div>

        {/* Feedback Alerts */}
        {actionMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-red-950/40 border-red-800/80 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span className="font-medium">{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-[#718096] hover:text-white transition text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-[#1E293B] space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'drafts', label: 'Personalized Drafts & Approvals', icon: Mail, count: drafts.length },
            { id: 'followups', label: 'Follow-up Tracker', icon: Clock },
            { id: 'sender_profiles', label: 'Sender Profile & CAN-SPAM', icon: UserCheck, count: senderProfiles.length },
            { id: 'campaigns', label: 'Campaigns', icon: Send, count: campaigns.length },
            { id: 'suppression', label: 'Suppression & Compliance', icon: Ban, count: suppressions.length },
            { id: 'overview', label: 'Compliance Overview', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition border-b-2 whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-[#FF8A3D] text-[#FF8A3D] bg-[#FF8A3D]/10'
                    : 'border-transparent text-[#A6B2C3] hover:text-white hover:bg-[#151F30]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    active ? 'bg-[#FF8A3D]/20 text-[#FF8A3D]' : 'bg-[#1C293B] text-[#718096]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: DRAFTS & APPROVALS (PRIMARY HUB) */}
        {activeTab === 'drafts' && (
          <div className="space-y-6">
            {/* Filters & Recurring Triggers Header */}
            <div className="flex flex-wrap justify-between items-center gap-4 bg-[#151F30] border border-[#243447] p-4 rounded-2xl shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-[#A6B2C3]">
                  <span>Campaign:</span>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="bg-[#0B1120] border border-[#243447] text-xs text-white rounded-xl px-3 py-2 focus:border-[#FF8A3D] outline-none transition"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#A6B2C3]">
                  <span>Status:</span>
                  <select
                    value={draftFilterStatus}
                    onChange={(e) => setDraftFilterStatus(e.target.value)}
                    className="bg-[#0B1120] border border-[#243447] text-xs text-white rounded-xl px-3 py-2 focus:border-[#FF8A3D] outline-none transition"
                  >
                    <option value="all">All Draft Statuses</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="sent">Manually Sent</option>
                    <option value="replied">Replied</option>
                    <option value="rejected">Rejected</option>
                    <option value="suppressed">Suppressed</option>
                  </select>
                </div>

                <div className="relative w-48 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-[#718096] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search prospect or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white placeholder-[#718096] focus:border-[#FF8A3D] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const res = await fetch(`${apiUrl}/outreach/recurring/run-now`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
                        credentials: 'include',
                        body: JSON.stringify({ batchSize: 25, maxDraftsPerRun: 10 }),
                      });
                      const json = await res.json();
                      if (res.ok) {
                        setActionMessage({
                          type: 'success',
                          text: `Recurring batch run complete: ${json.data.draftsGenerated} drafts generated. Placed in human-review queue.`,
                        });
                        fetchDrafts();
                        fetchAnalytics();
                      } else {
                        setActionMessage({ type: 'error', text: json.error?.message || 'Recurring batch run failed' });
                      }
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : String(e);
                      setActionMessage({ type: 'error', text: msg });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-3.5 py-2 bg-[#1C293B] hover:bg-[#243447] border border-[#2D3E53] text-[#FF8A3D] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="Trigger scheduled recurring draft generation batch now"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Run Recurring Batch
                </button>
              </div>
            </div>

            {/* Split Screen Layout: Draft List & Live Editor/Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Drafts List */}
              <div className="lg:col-span-5 space-y-3">
                {loading ? (
                  <div className="text-center py-20 text-[#A6B2C3] text-xs space-y-2 bg-[#151F30] rounded-3xl border border-[#243447]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FF8A3D]" />
                    <p>Loading outreach drafts...</p>
                  </div>
                ) : filteredDrafts.length === 0 ? (
                  <div className="text-center py-16 bg-[#151F30] border border-[#243447] rounded-3xl text-[#718096] text-xs space-y-3 p-6">
                    <Mail className="w-8 h-8 text-[#718096] mx-auto" />
                    <p className="text-sm font-semibold text-white">No outreach drafts found</p>
                    <p className="max-w-xs mx-auto">
                      Click &quot;Generate Drafts&quot; above to produce tailored proposals from qualified website audit evidence.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                    {filteredDrafts.map((d) => {
                      const isSelected = selectedDraft?.id === d.id;
                      return (
                        <div
                          key={d.id}
                          onClick={() => setSelectedDraft(d)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                            isSelected
                              ? 'bg-[#182337] border-[#FF8A3D] shadow-md shadow-[#FF8A3D]/10'
                              : 'bg-[#151F30] border-[#243447] hover:border-[#334155]'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-white">{d.businessName}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-[#1C293B] text-[#A6B2C3]">
                                  {d.countryCode?.toUpperCase()} • {d.industry}
                                </span>
                              </div>
                              <p className="text-xs text-[#A6B2C3] mt-1 font-mono">{d.recipientEmail}</p>
                            </div>

                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase border ${getStatusBadge(d.status)}`}>
                              {d.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-[#0B1120] border border-[#1E293B] text-xs text-[#A6B2C3]">
                            <span className="text-white font-medium truncate block">
                              &quot;{d.subject}&quot;
                            </span>
                            <div className="flex items-center gap-3 text-[10px] text-[#718096] font-mono mt-1">
                              <span>Fit: <strong className="text-emerald-400">{d.evidenceUsed?.businessFitScore || 90}/100</strong></span>
                              <span>Opportunity: <strong className="text-[#FF8A3D]">{d.evidenceUsed?.opportunityScore || 75}/100</strong></span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#718096] pt-1">
                            <span>Created {new Date(d.createdAt).toLocaleDateString()}</span>
                            <span className="text-[#FF8A3D] font-medium flex items-center gap-1">
                              Inspect <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Section 3 — Draft Editor & Live Email Preview */}
              <div className="lg:col-span-7">
                {selectedDraft ? (
                  <div className="rounded-3xl bg-[#151F30] border border-[#243447] shadow-xl overflow-hidden p-6 sm:p-7 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-[#FF8A3D]" />
                          <h3 className="text-base font-bold text-white">{selectedDraft.businessName}</h3>
                        </div>
                        <p className="text-xs text-[#A6B2C3] mt-0.5">
                          Target Recipient: <span className="font-mono text-white">{selectedDraft.recipientEmail}</span>
                        </p>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setEditingDraft(selectedDraft)}
                          className="px-3 py-1.5 rounded-xl bg-[#1C293B] hover:bg-[#243447] text-[#F8FAFC] text-xs font-semibold border border-[#2D3E53] flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                          Edit Copy
                        </button>

                        {selectedDraft.status === 'pending_review' && (
                          <button
                            onClick={() => handleApproveDraft(selectedDraft.id)}
                            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                          >
                            Approve Draft
                          </button>
                        )}

                        {selectedDraft.status === 'approved' && (
                          <button
                            onClick={() => handleMarkSent(selectedDraft.id)}
                            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Mark Sent
                          </button>
                        )}

                        {selectedDraft.status === 'sent' && (
                          <button
                            onClick={() => handleMarkReplied(selectedDraft.id)}
                            className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition cursor-pointer"
                          >
                            Mark Replied
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Factual Evidence Used Reference Card */}
                    <div className="p-4 rounded-2xl bg-[#0B1120] border border-[#1E293B] space-y-2">
                      <div className="text-[11px] font-bold text-[#FF8A3D] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Factual Website Evidence Referenced
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[#718096] block text-[10px]">Website State</span>
                          <strong className="text-white font-mono">{selectedDraft.evidenceUsed?.websiteState || 'EXISTING'}</strong>
                        </div>
                        <div>
                          <span className="text-[#718096] block text-[10px]">Opportunity Score</span>
                          <strong className="text-amber-400 font-mono">{selectedDraft.evidenceUsed?.opportunityScore || 75}/100</strong>
                        </div>
                        <div>
                          <span className="text-[#718096] block text-[10px]">Recommended Scope</span>
                          <strong className="text-emerald-400 font-mono">$750 Redesign</strong>
                        </div>
                        <div>
                          <span className="text-[#718096] block text-[10px]">Pitch Strategy</span>
                          <strong className="text-white font-mono">{selectedDraft.pitchType || 'First Contact'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Live Email Preview Box */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#A6B2C3]">
                        <span className="font-semibold uppercase tracking-wider text-[11px]">Subject Line</span>
                        <span className="text-[10px] text-[#718096] font-mono">Status: {selectedDraft.status.toUpperCase()}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#0B1120] border border-[#243447] text-xs font-semibold text-white">
                        {selectedDraft.subject}
                      </div>

                      <div className="text-xs font-semibold text-[#A6B2C3] uppercase tracking-wider text-[11px] pt-2">
                        Live Email Body Preview
                      </div>
                      <div className="p-5 rounded-2xl bg-[#0B1120] border border-[#243447] text-xs text-[#F8FAFC] whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-sans shadow-inner">
                        {selectedDraft.body}
                      </div>
                    </div>

                    {/* Sender Identity Preview Strip */}
                    <div className="p-3.5 rounded-xl bg-[#1C293B]/60 border border-[#2D3E53] text-[11px] text-[#A6B2C3] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Sender: <strong>{senderProfiles[0]?.senderName || 'Arif Mahmood'}</strong> ({senderProfiles[0]?.companyName || 'ArifTech'})</span>
                      </div>
                      <span className="font-mono text-[#718096]">CAN-SPAM Verified Footer Included</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-16 rounded-3xl bg-[#151F30] border border-[#243447] text-center text-[#718096] text-xs space-y-2">
                    <Mail className="w-10 h-10 mx-auto text-[#718096]" />
                    <p className="text-sm font-semibold text-white">Select a draft to inspect</p>
                    <p>Choose an outreach prospect from the left list to review tailored pitch copy and audit telemetry.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FOLLOW-UP TRACKER */}
        {activeTab === 'followups' && (
          <div className="rounded-3xl bg-[#151F30] border border-[#243447] p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF8A3D]" />
                  <h3 className="text-base font-bold text-white">Follow-Up Schedule &amp; Cadence Management</h3>
                </div>
                <p className="text-xs text-[#A6B2C3]">
                  Automated cadence evaluator for leads where manual outreach was recorded. Stops automatically upon reply or opt-out.
                </p>
              </div>

              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const res = await fetch(`${apiUrl}/crm/follow-ups/run-now`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken || '' },
                      credentials: 'include',
                      body: JSON.stringify({ firstFollowUpDelayDays: 3, secondFollowUpDelayDays: 5 }),
                    });
                    const json = await res.json();
                    if (res.ok) {
                      setActionMessage({
                        type: 'success',
                        text: `Follow-up evaluation complete: ${json.data.followUpsScheduled} scheduled, ${json.data.draftsGenerated} drafts generated.`,
                      });
                      fetchDrafts();
                      fetchAnalytics();
                    } else {
                      setActionMessage({ type: 'error', text: json.error?.message || 'Follow-up dispatch failed' });
                    }
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : String(e);
                    setActionMessage({ type: 'error', text: msg });
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 bg-[#1C293B] hover:bg-[#243447] border border-[#2D3E53] text-[#FF8A3D] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Run Follow-Up Batch
              </button>
            </div>

            <div className="space-y-3">
              {drafts.filter((d) => d.status === 'sent' || d.scheduledFollowUpDate).length === 0 ? (
                <div className="text-center py-12 text-[#718096] text-xs">
                  No active follow-ups scheduled. Mark an approved draft as sent to initiate the automated cadence schedule.
                </div>
              ) : (
                drafts
                  .filter((d) => d.status === 'sent' || d.scheduledFollowUpDate)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="p-4 bg-[#0B1120] border border-[#1E293B] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-white text-sm block">{d.businessName}</span>
                        <div className="flex items-center gap-3 text-xs text-[#A6B2C3]">
                          <span>Recipient: <strong className="font-mono text-white">{d.recipientEmail}</strong></span>
                          <span>Sent: {d.sentAt ? new Date(d.sentAt).toLocaleDateString() : 'Recorded'}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col sm:items-end justify-between items-center gap-2">
                        <span className="text-[#FF8A3D] font-mono text-xs">
                          Follow-up: {d.scheduledFollowUpDate ? new Date(d.scheduledFollowUpDate).toLocaleDateString() : 'Due'}
                        </span>
                        <button
                          onClick={() => handleMarkReplied(d.id)}
                          className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Record Reply
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SENDER PROFILE & CAN-SPAM REGISTRY */}
        {activeTab === 'sender_profiles' && (
          <div className="rounded-3xl bg-[#151F30] border border-[#243447] p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  Sender Identities &amp; CAN-SPAM Compliance Registry
                </h3>
                <p className="text-xs text-[#A6B2C3] mt-0.5">
                  Every outbound message requires a verified sender profile with an authentic company name and valid physical postal address (CAN-SPAM 15 U.S.C. 7701).
                </p>
              </div>
              <button
                onClick={() => setProfileModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#FF8A3D]/20 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" /> Add Sender Profile
              </button>
            </div>

            {senderProfiles.length === 0 ? (
              <div className="p-10 rounded-2xl bg-[#0B1120] border border-[#243447] text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Sender Profile Configured</h4>
                <p className="text-xs text-[#A6B2C3] max-w-md mx-auto">
                  Outreach draft approvals are currently blocked for compliance safety. Please register your agency&apos;s verified business name and legitimate postal mailing address before generating pitches.
                </p>
                <button
                  onClick={() => setProfileModal(true)}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Configure Agency Sender Profile
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {senderProfiles.map((p) => (
                  <div key={p.id} className="p-6 rounded-2xl bg-[#0B1120] border border-[#1E293B] space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">{p.senderName}</h4>
                        <p className="text-xs text-[#A6B2C3]">{p.senderTitle || 'Outreach Specialist'} • {p.companyName}</p>
                      </div>
                      {p.isDefault && (
                        <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Default Sender
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#A6B2C3] space-y-1.5 pt-3 border-t border-[#1E293B]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#718096]">Email:</span>
                        <span className="font-mono text-white">{p.senderEmail}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[#718096]">Mailing Address:</span>
                        <span className="text-white">{p.physicalAddress}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCampaignId(c.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    selectedCampaignId === c.id
                      ? 'bg-[#182337] border-[#FF8A3D] shadow-lg shadow-[#FF8A3D]/10'
                      : 'bg-[#151F30] border-[#243447] hover:border-[#334155]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-white">{c.name}</h3>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#A6B2C3] line-clamp-2">
                    {c.description || 'Targeting boutique consulting firm website redesign opportunities.'}
                  </p>
                  <div className="pt-3 border-t border-[#1E293B] grid grid-cols-3 text-center text-xs">
                    <div>
                      <span className="text-[#718096] block text-[10px]">Leads</span>
                      <strong className="text-white">{c.totalLeads}</strong>
                    </div>
                    <div>
                      <span className="text-[#718096] block text-[10px]">Sent</span>
                      <strong className="text-blue-400">{c.sentCount}</strong>
                    </div>
                    <div>
                      <span className="text-[#718096] block text-[10px]">Replies</span>
                      <strong className="text-emerald-400">{c.repliedCount}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SUPPRESSION & COMPLIANCE */}
        {activeTab === 'suppression' && (
          <div className="rounded-3xl bg-[#151F30] border border-[#243447] overflow-hidden shadow-xl space-y-4 p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Ban className="w-4 h-4 text-rose-400" />
                  Suppression Registry &amp; Opt-Out Enforcement
                </h3>
                <p className="text-xs text-[#A6B2C3] mt-0.5">
                  Emails in this registry are blocked by the Compliance Engine before draft generation or approvals.
                </p>
              </div>
              <button
                onClick={() => setSuppressModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" /> Add Suppression
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#A6B2C3]">
                <thead className="bg-[#111827] text-[11px] uppercase font-bold text-[#718096] border-b border-[#1E293B]">
                  <tr>
                    <th className="px-5 py-3.5">Suppressed Email</th>
                    <th className="px-5 py-3.5">Scope</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Source</th>
                    <th className="px-5 py-3.5">Date Suppressed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {suppressions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[#718096]">
                        No suppression records recorded in this workspace.
                      </td>
                    </tr>
                  ) : (
                    suppressions.map((r) => (
                      <tr key={r.id} className="hover:bg-[#182337]/50">
                        <td className="px-5 py-3.5 font-mono font-medium text-white">{r.email}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#1C293B] text-slate-300">
                            {r.scope}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">{r.reason}</td>
                        <td className="px-5 py-3.5 text-[#718096]">{r.source}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-[#718096]">
                          {new Date(r.suppressedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: COMPLIANCE ARCHITECTURE OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="rounded-3xl bg-[#151F30] border border-[#243447] p-6 sm:p-7 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#FF8A3D] font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-[#FF8A3D]" /> Compliance Architecture (USA, UK, CA, AU)
              </div>
              <ul className="text-xs text-[#A6B2C3] space-y-2">
                <li>
                  • <strong>CAN-SPAM Act (USA):</strong> Accurate headers, valid physical address, and instant permanent opt-out enforcement.
                </li>
                <li>
                  • <strong>PECR &amp; UK GDPR (UK):</strong> Legitimate interests for corporate subscribers with explicit opt-out.
                </li>
                <li>
                  • <strong>CASL (Canada):</strong> B2B implied consent from conspicuously published contact records without promotional disclaimers.
                </li>
                <li>
                  • <strong>Spam Act 2003 (Australia):</strong> Inferred consent for public business contacts related directly to their business capacity.
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Operational Guarantees
              </div>
              <ul className="text-xs text-[#A6B2C3] space-y-2">
                <li>
                  • <strong>Zero Automatic Deliverability:</strong> All outreach requires explicit manual review, approval, and operator transmission.
                </li>
                <li>
                  • <strong>Zero Paid APIs:</strong> Deterministic personalization engine directly leverages Phase 05/06 technical findings.
                </li>
                <li>
                  • <strong>Multi-Tenant Isolation:</strong> Strict workspace scoping across suppression lists, campaign records, and consent history.
                </li>
                <li>
                  • <strong>Audit Trails:</strong> Every draft generation, approval, manual transmission, and opt-out is permanently logged.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* EDIT DRAFT MODAL */}
        {editingDraft && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151F30] border border-[#243447] rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-4 shadow-2xl">
              <div className="flex justify-between items-start border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Edit Outreach Draft Copy</h3>
                <button
                  onClick={() => setEditingDraft(null)}
                  className="text-[#718096] hover:text-white transition text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#A6B2C3] block mb-1">Subject</label>
                  <input
                    type="text"
                    value={editingDraft.subject}
                    onChange={(e) => setEditingDraft({ ...editingDraft, subject: e.target.value })}
                    className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A6B2C3] block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={editingDraft.recipientEmail}
                    onChange={(e) => setEditingDraft({ ...editingDraft, recipientEmail: e.target.value })}
                    className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A6B2C3] block mb-1">Message Body</label>
                  <textarea
                    rows={10}
                    value={editingDraft.body}
                    onChange={(e) => setEditingDraft({ ...editingDraft, body: e.target.value })}
                    className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3.5 rounded-xl focus:border-[#FF8A3D] outline-none font-sans leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1E293B]">
                <button
                  onClick={() => setEditingDraft(null)}
                  className="px-4 py-2 text-xs text-[#A6B2C3] hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#FF8A3D]/20 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GENERATE DRAFTS MODAL */}
        {generateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#151F30] border border-[#243447] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl">
              <div className="flex justify-between items-start border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Generate Personalized Drafts</h3>
                <button
                  onClick={() => setGenerateModal(false)}
                  className="text-[#718096] hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#A6B2C3] leading-relaxed">
                The engine analyzes verified businesses in this campaign and constructs tailored pitches using real technical audit evidence.
              </p>

              <div>
                <label className="text-xs font-semibold text-[#A6B2C3] block mb-1.5">Pitch Strategy</label>
                <select
                  value={genPitchType}
                  onChange={(e) => setGenPitchType(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none"
                >
                  <option value="first_contact">Adaptive (Redesign vs Turnkey Site Build)</option>
                  <option value="website_redesign">Website Modernization &amp; Speed Redesign ($750)</option>
                  <option value="new_website_build">Turnkey Corporate Website Build (No-Site Leads)</option>
                  <option value="follow_up">Gentle Follow-Up Email</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1E293B]">
                <button
                  onClick={() => setGenerateModal(false)}
                  className="px-4 py-2 text-xs text-[#A6B2C3] hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateDrafts}
                  className="px-5 py-2 bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#FF8A3D]/20 transition cursor-pointer"
                >
                  Generate Drafts
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE CAMPAIGN MODAL */}
        {newCampaignModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateCampaign}
              className="bg-[#151F30] border border-[#243447] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-start border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Create New Outreach Campaign</h3>
                <button
                  type="button"
                  onClick={() => setNewCampaignModal(false)}
                  className="text-[#718096] hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A6B2C3] block mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 US Consulting Redesigns"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A6B2C3] block mb-1.5">Description / Strategy</label>
                <textarea
                  rows={3}
                  placeholder="Targeting US consulting firms with slow initial response times..."
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setNewCampaignModal(false)}
                  className="px-4 py-2 text-xs text-[#A6B2C3] hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#FF8A3D]/20 transition cursor-pointer"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SENDER PROFILE MODAL */}
        {profileModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateSenderProfile}
              className="bg-[#151F30] border border-[#243447] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-start border-b border-[#1E293B] pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">Agency Sender Identity</h3>
                  <p className="text-xs text-[#A6B2C3] mt-0.5">
                    Required by CAN-SPAM (15 U.S.C. 7701) to enable pitch generation and draft approvals.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileModal(false)}
                  className="text-[#718096] hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#A6B2C3] block mb-1">Company / Agency Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ArifTech"
                    value={profileForm.companyName}
                    onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                    className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#A6B2C3] block mb-1">Sender Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arif Mahmood"
                      value={profileForm.senderName}
                      onChange={(e) => setProfileForm({ ...profileForm, senderName: e.target.value })}
                      className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#A6B2C3] block mb-1">Professional Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Founder & Lead Technologist"
                      value={profileForm.senderTitle}
                      onChange={(e) => setProfileForm({ ...profileForm, senderTitle: e.target.value })}
                      className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A6B2C3] block mb-1">Outreach Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="arifranabk@gmail.com"
                    value={profileForm.senderEmail}
                    onChange={(e) => setProfileForm({ ...profileForm, senderEmail: e.target.value })}
                    className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A6B2C3] block mb-1">Physical Postal Address * (Min 10 characters)</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Plaza 309, 1st Floor, Phase 1, Pakistan Town, Islamabad, Pakistan"
                    value={profileForm.physicalAddress}
                    onChange={(e) => setProfileForm({ ...profileForm, physicalAddress: e.target.value })}
                    className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none"
                  />
                  <p className="text-[10px] text-amber-400 mt-1">
                    Notice: Must be your authentic physical street address or registered postal box.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setProfileModal(false)}
                  className="px-4 py-2 text-xs text-[#A6B2C3] hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#FF8A3D] to-[#FF9B57] hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#FF8A3D]/20 transition cursor-pointer"
                >
                  Save Sender Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ADD SUPPRESSION MODAL */}
        {suppressModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleAddSuppression}
              className="bg-[#151F30] border border-[#243447] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-start border-b border-[#1E293B] pb-3">
                <h3 className="text-base font-bold text-white">Add Suppression / Opt-Out Record</h3>
                <button
                  type="button"
                  onClick={() => setSuppressModal(false)}
                  className="text-[#718096] hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A6B2C3] block mb-1.5">Email Address to Suppress</label>
                <input
                  type="email"
                  required
                  placeholder="contact@company.com"
                  value={suppressEmail}
                  onChange={(e) => setSuppressEmail(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A6B2C3] block mb-1.5">Reason</label>
                <select
                  value={suppressReason}
                  onChange={(e) => setSuppressReason(e.target.value)}
                  className="w-full bg-[#0B1120] border border-[#243447] text-xs text-white p-3 rounded-xl focus:border-[#FF8A3D] outline-none"
                >
                  <option value="unsubscribe_request">Unsubscribe Request</option>
                  <option value="manual_suppression">Manual Operator Block</option>
                  <option value="bounce">Hard Bounce / Inactive</option>
                  <option value="complaint">Complaint / Do-Not-Contact</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setSuppressModal(false)}
                  className="px-4 py-2 text-xs text-[#A6B2C3] hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Suppress Email
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
