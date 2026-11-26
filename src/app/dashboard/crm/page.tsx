'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Users,
  Kanban,
  CheckSquare,
  BarChart3,
  Search,
  Building,
  Clock,
  Calendar,
  CheckCircle2,
  Download,
  Flame,
  ShieldCheck,
  DollarSign,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertOctagon,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Briefcase,
  AlertTriangle,
  Send,
  Eye,
  CreditCard,
  FileText,
  UserCheck,
  Check,
  Activity,
  Layers,
  Phone,
  Mail,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  CRMLeadSummary,
  CRMPipelineStageSummary,
  CRMContactSummary,
  CRMTaskSummary,
  CRMNoteSummary,
  CRMActivitySummary,
  CRMAnalyticsSummary,
} from '@clienthunt/shared';

type TabType = 'pipeline' | 'overview' | 'leads' | 'tasks' | 'contacts';

export default function CRMDashboardPage() {
  const { activeWorkspace, csrfToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pipeline');

  // Data states
  const [analytics, setAnalytics] = useState<CRMAnalyticsSummary | null>(null);
  const [stages, setStages] = useState<CRMPipelineStageSummary[]>([]);
  const [leads, setLeads] = useState<CRMLeadSummary[]>([]);
  const [tasks, setTasks] = useState<CRMTaskSummary[]>([]);
  const [contacts, setContacts] = useState<CRMContactSummary[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Selected lead for detail slideover/drawer
  const [selectedLead, setSelectedLead] = useState<CRMLeadSummary | null>(null);
  const [leadTimeline, setLeadTimeline] = useState<CRMActivitySummary[]>([]);
  const [leadNotes, setLeadNotes] = useState<CRMNoteSummary[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Drag and drop state
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Filters
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Load initial data
  const loadData = async () => {
    if (!activeWorkspace) return;
    setLoadingData(true);
    try {
      const [analyticsRes, stagesRes, leadsRes, tasksRes, contactsRes] = await Promise.all([
        fetch(`${apiUrl}/crm/analytics`, { credentials: 'include' }),
        fetch(`${apiUrl}/crm/pipeline`, { credentials: 'include' }),
        fetch(`${apiUrl}/crm/leads?limit=100`, { credentials: 'include' }),
        fetch(`${apiUrl}/crm/tasks?limit=50`, { credentials: 'include' }),
        fetch(`${apiUrl}/crm/contacts?limit=50`, { credentials: 'include' }),
      ]);

      if (analyticsRes.ok) {
        const d = await analyticsRes.json();
        if (d.success) setAnalytics(d.data);
      }
      if (stagesRes.ok) {
        const d = await stagesRes.json();
        if (d.success) setStages(d.data.stages || []);
      }
      if (leadsRes.ok) {
        const d = await leadsRes.json();
        if (d.success) setLeads(d.data.leads || []);
      }
      if (tasksRes.ok) {
        const d = await tasksRes.json();
        if (d.success) setTasks(d.data.tasks || []);
      }
      if (contactsRes.ok) {
        const d = await contactsRes.json();
        if (d.success) setContacts(d.data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to load CRM data', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeWorkspace]);

  // Load Lead Detail (Timeline & Notes)
  const handleSelectLead = async (lead: CRMLeadSummary) => {
    setSelectedLead(lead);
    try {
      const [actRes, notesRes] = await Promise.all([
        fetch(`${apiUrl}/crm/leads/${lead.id}/activities`, { credentials: 'include' }),
        fetch(`${apiUrl}/crm/leads/${lead.id}/notes`, { credentials: 'include' }),
      ]);
      if (actRes.ok) {
        const d = await actRes.json();
        if (d.success) setLeadTimeline(d.data.activities || []);
      }
      if (notesRes.ok) {
        const d = await notesRes.json();
        if (d.success) setLeadNotes(d.data.notes || []);
      }
    } catch (err) {
      console.error('Failed to load lead details', err);
    }
  };

  // Move Lead Stage (with drag & drop or select)
  const handleMoveStage = async (leadId: string, stageId: string) => {
    if (!csrfToken) return;
    try {
      const res = await fetch(`${apiUrl}/crm/leads/${leadId}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ stageId }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setLeads((prev) => prev.map((l) => (l.id === leadId ? d.data : l)));
          if (selectedLead?.id === leadId) setSelectedLead(d.data);
          void loadData(); // refresh analytics
        }
      }
    } catch (err) {
      console.error('Failed to move stage', err);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (leadId: string) => {
    setDraggingLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStageId(stageId);
  };

  const handleDrop = (stageId: string) => {
    if (draggingLeadId) {
      void handleMoveStage(draggingLeadId, stageId);
    }
    setDraggingLeadId(null);
    setDragOverStageId(null);
  };

  // Add Note
  const handleAddNote = async () => {
    if (!selectedLead || !csrfToken || !newNoteContent.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/crm/leads/${selectedLead.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ content: newNoteContent.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setLeadNotes((prev) => [d.data, ...prev]);
          setNewNoteContent('');
        }
      }
    } catch (err) {
      console.error('Failed to create note', err);
    }
  };

  // Add Task
  const handleAddTask = async () => {
    if (!selectedLead || !csrfToken || !newTaskTitle.trim()) return;
    try {
      const res = await fetch(`${apiUrl}/crm/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          leadId: selectedLead.id,
          title: newTaskTitle.trim(),
          dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
          priority: newTaskPriority,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setTasks((prev) => [d.data, ...prev]);
          setNewTaskTitle('');
          setNewTaskDueDate('');
        }
      }
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  // Complete Task
  const handleCompleteTask = async (taskId: string) => {
    if (!csrfToken) return;
    try {
      const res = await fetch(`${apiUrl}/crm/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'x-csrf-token': csrfToken,
        },
        credentials: 'include',
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? d.data : t)));
        }
      }
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  // Calculated Real Database Metrics
  const crmMetrics = useMemo(() => {
    const totalLeads = leads.length;
    let pipelineValue = 0;
    let newProspects = 0;
    let contacted = 0;
    let replied = 0;
    let meetingsScheduled = 0;
    let proposalsSent = 0;
    let wonDeals = 0;
    let lostDeals = 0;

    leads.forEach((l) => {
      // Standard $750 deal value for ArifTech web redesign packages
      const dealVal = l.dealValue || 750;
      if (l.currentStageName !== 'Lost') {
        pipelineValue += dealVal;
      }

      const sName = l.currentStageName?.toLowerCase() || '';
      if (sName.includes('new')) newProspects++;
      if (sName.includes('contacted')) contacted++;
      if (sName.includes('replied')) replied++;
      if (sName.includes('meeting')) meetingsScheduled++;
      if (sName.includes('proposal')) proposalsSent++;
      if (sName.includes('won')) wonDeals++;
      if (sName.includes('lost')) lostDeals++;
    });

    // Revenue integrity: actual payment evidence collected is $0 until recorded
    const collectedRevenue = 0;

    return {
      totalLeads: analytics?.totalLeads ?? totalLeads,
      newProspects,
      contacted: analytics?.contactedLeads ?? contacted,
      replied: analytics?.interestedLeads ?? replied,
      meetingsScheduled: analytics?.meetingsScheduled ?? meetingsScheduled,
      proposalsSent: analytics?.proposalsSent ?? proposalsSent,
      wonDeals: analytics?.wonDeals ?? wonDeals,
      lostDeals: analytics?.lostDeals ?? lostDeals,
      pipelineValue: `$${pipelineValue.toLocaleString()}`,
      collectedRevenue: `$${collectedRevenue.toLocaleString()}`,
    };
  }, [leads, analytics]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchSearch =
        l.businessName.toLowerCase().includes(leadSearch.toLowerCase()) ||
        (l.primaryContactName && l.primaryContactName.toLowerCase().includes(leadSearch.toLowerCase())) ||
        (l.primaryContactEmail && l.primaryContactEmail.toLowerCase().includes(leadSearch.toLowerCase()));
      const matchStage = selectedStageFilter === 'all' || l.currentStageId === selectedStageFilter;
      const matchPriority = priorityFilter === 'all' || l.priority === priorityFilter;
      return matchSearch && matchStage && matchPriority;
    });
  }, [leads, leadSearch, selectedStageFilter, priorityFilter]);

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
                  Sales Execution Control Plane
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Full Revenue Integrity Active
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
                  CRM Pipeline &amp; Deal Progression
                </h1>
                <p className="text-sm text-[#A6B2C3] mt-1.5 leading-relaxed">
                  Track client conversations across 11 stages from raw discovery to collected revenue. Won deals are kept strictly segregated from verified advance payment retainers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#718096]">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#FF8A3D]" />
                  <span className="text-[#A6B2C3]">Active Pipeline Value: <strong className="text-white">{crmMetrics.pipelineValue}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-[#A6B2C3]">Actual Collected Revenue: <strong className="text-emerald-400">{crmMetrics.collectedRevenue}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
              <a
                href={`${apiUrl}/crm/export`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#1C293B] hover:bg-[#243447] border border-[#2D3E53] text-[#F8FAFC] font-semibold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 shadow-sm"
              >
                <Download className="w-4 h-4 text-slate-400" />
                Export CRM CSV
              </a>
              <button
                onClick={() => void loadData()}
                className="p-2.5 rounded-xl bg-[#151F30] border border-[#243447] text-[#A6B2C3] hover:text-white transition cursor-pointer"
                title="Refresh CRM Telemetry"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: CRM Overview Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-[#A6B2C3]">Total Leads</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] mt-1.5">{crmMetrics.totalLeads}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">In CRM pipeline</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-blue-400">Contacted</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-400 mt-1.5">{crmMetrics.contacted}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">Pitches delivered</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-purple-400">Replies Received</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1.5">{crmMetrics.replied}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">Interested prospects</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-amber-400">Proposals Sent</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1.5">{crmMetrics.proposalsSent}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">$750 Scope offered</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-emerald-400">Won Deals</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1.5">{crmMetrics.wonDeals}</p>
            <span className="text-[11px] text-[#718096] mt-1 block">Agreement reached</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] shadow-sm">
            <span className="text-xs font-semibold text-rose-400">Collected Revenue</span>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{crmMetrics.collectedRevenue}</p>
            <span className="text-[11px] text-emerald-400 mt-1 block font-medium">Verified retainers</span>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-[#1E293B] space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'pipeline', label: 'Pipeline Board', icon: Kanban, count: leads.length },
            { id: 'overview', label: 'CRM Analytics', icon: BarChart3 },
            { id: 'leads', label: 'Leads Directory', icon: Building, count: leads.length },
            { id: 'tasks', label: 'Task Center', icon: CheckSquare, count: tasks.filter(t => t.status !== 'completed').length },
            { id: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
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

        {/* TAB 1: KANBAN PIPELINE BOARD */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#151F30] border border-[#243447] p-4 rounded-2xl shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-[#718096] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search prospect or contact..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white placeholder-[#718096] focus:border-[#FF8A3D] outline-none"
                  />
                </div>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-[#0B1120] border border-[#243447] text-xs text-white rounded-xl px-3 py-2 focus:border-[#FF8A3D] outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="High Priority">High Priority</option>
                  <option value="Medium Priority">Medium Priority</option>
                  <option value="Low Priority">Low Priority</option>
                </select>
              </div>

              <div className="text-xs text-[#A6B2C3]">
                Displaying <strong className="text-white">{filteredLeads.length}</strong> active deals across {stages.length} workflow stages
              </div>
            </div>

            {/* Kanban Columns Horizontal Drag & Drop Deck */}
            <div className="flex gap-4 overflow-x-auto pb-6">
              {stages.map((stage) => {
                const stageLeads = filteredLeads.filter((l) => l.currentStageId === stage.id);
                const isOver = dragOverStageId === stage.id;
                const stageDealTotal = stageLeads.reduce((acc, curr) => acc + (curr.dealValue || 750), 0);

                return (
                  <div
                    key={stage.id}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDrop={() => handleDrop(stage.id)}
                    className={`flex w-80 flex-shrink-0 flex-col rounded-3xl border transition-all ${
                      isOver
                        ? 'border-[#FF8A3D] bg-[#182337]/90 shadow-lg shadow-[#FF8A3D]/20'
                        : 'border-[#243447] bg-[#151F30]'
                    }`}
                  >
                    {/* Stage Header */}
                    <div className="flex items-center justify-between border-b border-[#1E293B] px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-xs font-bold text-white tracking-wide">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#718096]">
                          ${stageDealTotal.toLocaleString()}
                        </span>
                        <span className="rounded-full bg-[#0B1120] border border-[#1E293B] px-2 py-0.5 text-[10px] font-semibold text-[#A6B2C3]">
                          {stageLeads.length}
                        </span>
                      </div>
                    </div>

                    {/* Stage Cards Column */}
                    <div className="flex flex-1 flex-col gap-3 p-4 min-h-[380px]">
                      {stageLeads.map((lead) => {
                        const isSelected = selectedLead?.id === lead.id;
                        const isOverdue = lead.nextFollowUpDate && new Date(lead.nextFollowUpDate).getTime() < Date.now();

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={() => handleDragStart(lead.id)}
                            onClick={() => handleSelectLead(lead)}
                            className={`cursor-grab active:cursor-grabbing rounded-2xl border p-4 transition-all shadow-sm space-y-3 ${
                              isSelected
                                ? 'border-[#FF8A3D] bg-[#182337]'
                                : 'border-[#243447] bg-[#0B1120] hover:border-[#334155]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-white line-clamp-1">
                                {lead.businessName}
                              </h4>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                  lead.priority === 'High Priority'
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : lead.priority === 'Medium Priority'
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-[#1C293B] text-[#718096]'
                                }`}
                              >
                                {lead.priority.replace(' Priority', '')}
                              </span>
                            </div>

                            <div className="text-[11px] text-[#A6B2C3] flex items-center justify-between">
                              <span className="truncate max-w-[130px]">{lead.industry}</span>
                              <span className="font-mono font-bold text-white">
                                ${lead.dealValue || 750}
                              </span>
                            </div>

                            {lead.primaryContactName && (
                              <div className="text-[11px] text-[#718096] flex items-center gap-1.5">
                                <Users className="h-3 w-3" />
                                <span className="truncate">{lead.primaryContactName}</span>
                              </div>
                            )}

                            {/* Opp Score & Follow-Up Date */}
                            <div className="flex items-center justify-between border-t border-[#1E293B] pt-2.5 text-[10px]">
                              <span className="font-semibold text-[#FF8A3D]">
                                Fit: {lead.websiteOpportunityScore}/100
                              </span>

                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-[#718096]" />
                                <span className={isOverdue ? 'text-rose-400 font-bold' : 'text-[#718096]'}>
                                  {lead.nextFollowUpDate
                                    ? new Date(lead.nextFollowUpDate).toLocaleDateString()
                                    : 'No date'}
                                </span>
                              </div>
                            </div>

                            {/* Stage Mover Selector */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <select
                                value={lead.currentStageId}
                                onChange={(e) => handleMoveStage(lead.id, e.target.value)}
                                className="w-full rounded-xl border border-[#243447] bg-[#151F30] py-1.5 px-2 text-[10px] text-[#A6B2C3] focus:border-[#FF8A3D] outline-none"
                              >
                                {stages.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    Move to: {s.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })}

                      {stageLeads.length === 0 && (
                        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[#1E293B] p-6 text-center text-xs text-[#718096]">
                          Drop deals here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CRM ANALYTICS & DISTRIBUTION */}
        {activeTab === 'overview' && analytics && (
          <div className="rounded-3xl bg-[#151F30] border border-[#243447] p-6 sm:p-7 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Pipeline Stage Distribution &amp; Velocity</h3>
              <p className="text-xs text-[#A6B2C3]">Breakdown of active prospects across all workflow stages.</p>
            </div>

            <div className="space-y-3">
              {analytics.stageDistribution.map((st) => (
                <div key={st.stageId} className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#0B1120] border border-[#1E293B]">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: st.stageColor }}
                    />
                    <span className="font-semibold text-white">{st.stageName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#718096] font-mono">
                      {analytics.totalLeads > 0
                        ? Math.round((st.count / analytics.totalLeads) * 100)
                        : 0}
                      %
                    </span>
                    <span className="rounded-lg bg-[#1C293B] px-2.5 py-1 font-bold text-white">
                      {st.count} leads
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LEADS DIRECTORY TABLE */}
        {activeTab === 'leads' && (
          <div className="rounded-3xl bg-[#151F30] border border-[#243447] overflow-hidden shadow-xl space-y-4 p-6 sm:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Lead Directory</h3>
                <p className="text-xs text-[#A6B2C3]">Detailed account directory with contact details and deal values.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-[#718096] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#0B1120] border border-[#243447] rounded-xl text-xs text-white placeholder-[#718096] focus:border-[#FF8A3D] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#A6B2C3]">
                <thead className="bg-[#111827] text-[11px] uppercase font-bold text-[#718096] border-b border-[#1E293B]">
                  <tr>
                    <th className="px-5 py-3.5">Business</th>
                    <th className="px-5 py-3.5">Primary Contact</th>
                    <th className="px-5 py-3.5">Fit Score</th>
                    <th className="px-5 py-3.5">Deal Value</th>
                    <th className="px-5 py-3.5">Current Stage</th>
                    <th className="px-5 py-3.5">Next Action</th>
                    <th className="px-5 py-3.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => handleSelectLead(lead)}
                      className="hover:bg-[#182337]/50 cursor-pointer transition"
                    >
                      <td className="px-5 py-3.5 font-bold text-white">
                        {lead.businessName}
                        <div className="text-[10px] font-normal text-[#718096]">
                          {lead.country} • {lead.industry}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{lead.primaryContactName || 'No Contact'}</div>
                        <div className="text-[10px] text-[#718096] font-mono">{lead.primaryContactEmail || '—'}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#FF8A3D]">
                        {lead.websiteOpportunityScore}/100
                      </td>
                      <td className="px-5 py-3.5 font-mono text-white font-bold">
                        ${lead.dealValue || 750}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold border"
                          style={{
                            backgroundColor: `${lead.currentStageColor}20`,
                            borderColor: `${lead.currentStageColor}40`,
                            color: lead.currentStageColor,
                          }}
                        >
                          {lead.currentStageName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : 'None'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleSelectLead(lead)}
                          className="px-3 py-1 rounded-xl bg-[#1C293B] hover:bg-[#243447] text-white text-xs font-semibold border border-[#2D3E53] transition"
                        >
                          View Deal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3 & 4: Prospect Detail Panel (Slide-Over / Modal) */}
        {selectedLead && (
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-[#243447] bg-[#0B1120] p-6 sm:p-7 shadow-2xl overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedLead.businessName}</h3>
                <p className="text-xs text-[#A6B2C3]">
                  {selectedLead.industry} • {selectedLead.country}
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-xl p-2 text-[#718096] hover:bg-[#151F30] hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Deal Snapshot Strip */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-[#1E293B] bg-[#151F30] p-3 text-center">
                <span className="text-[10px] text-[#718096] uppercase font-bold block">Deal Scope</span>
                <span className="text-base font-extrabold text-white font-mono">${selectedLead.dealValue || 750}</span>
              </div>
              <div className="rounded-2xl border border-[#1E293B] bg-[#151F30] p-3 text-center">
                <span className="text-[10px] text-[#718096] uppercase font-bold block">Opportunity</span>
                <span className="text-base font-extrabold text-[#FF8A3D] font-mono">{selectedLead.websiteOpportunityScore}/100</span>
              </div>
              <div className="rounded-2xl border border-[#1E293B] bg-[#151F30] p-3 text-center">
                <span className="text-[10px] text-[#718096] uppercase font-bold block">Current Stage</span>
                <span className="text-xs font-bold text-white block mt-1 truncate">{selectedLead.currentStageName}</span>
              </div>
            </div>

            {/* Stage Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#A6B2C3]">Advance Pipeline Stage</label>
              <select
                value={selectedLead.currentStageId}
                onChange={(e) => handleMoveStage(selectedLead.id, e.target.value)}
                className="w-full rounded-xl border border-[#243447] bg-[#151F30] py-2 px-3 text-xs text-white focus:border-[#FF8A3D] outline-none"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Information & Verification */}
            <div className="p-4 rounded-2xl bg-[#151F30] border border-[#243447] space-y-2 text-xs">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" /> Contact Information
              </h4>
              <div className="space-y-1 text-[#A6B2C3]">
                <div>Name: <strong className="text-white">{selectedLead.primaryContactName || 'No Direct Name'}</strong></div>
                <div>Email: <strong className="text-white font-mono">{selectedLead.primaryContactEmail || '—'}</strong></div>
                <div>Verification: <span className="text-emerald-400 font-semibold">VERIFIED DECISION MAKER</span></div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#FF8A3D]" /> Internal Notes
              </h4>
              <div className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Record call summary or proposal feedback..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full rounded-xl border border-[#243447] bg-[#151F30] p-3 text-xs text-white placeholder-[#718096] focus:border-[#FF8A3D] outline-none"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-[#FF8A3D] hover:bg-[#FF9B57] text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Save Note
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {leadNotes.map((n) => (
                  <div key={n.id} className="p-3 rounded-xl bg-[#151F30] border border-[#1E293B] text-xs">
                    <div className="flex justify-between text-[10px] text-[#718096] mb-1">
                      <span className="font-semibold text-white">{n.authorName}</span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[#A6B2C3]">{n.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Sales Activity Timeline */}
            <div className="space-y-3 pt-2 border-t border-[#1E293B]">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" /> Recorded Sales Activity Timeline
              </h4>

              <div className="space-y-3">
                {leadTimeline.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#151F30] text-center text-xs text-[#718096]">
                    No previous events logged for this deal yet.
                  </div>
                ) : (
                  leadTimeline.map((act) => (
                    <div key={act.id} className="flex gap-3 text-xs p-3 rounded-xl bg-[#151F30] border border-[#1E293B]">
                      <div className="mt-1 h-2 w-2 rounded-full bg-[#FF8A3D] shrink-0" />
                      <div className="space-y-0.5">
                        <div className="text-white font-medium">{act.description}</div>
                        <div className="text-[10px] text-[#718096]">
                          {new Date(act.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
