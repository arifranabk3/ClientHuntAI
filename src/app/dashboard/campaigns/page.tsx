'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CheckCircle2, Play } from 'lucide-react';

interface CampaignStatus {
  totalLeads: number;
  contacted: number;
  replied: number;
}

export default function CampaignsPage() {
  const { activeWorkspace } = useAuth();
  const [status, setStatus] = useState<CampaignStatus>({ totalLeads: 0, contacted: 0, replied: 0 });
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!activeWorkspace) return;
    const fetchCampaignStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/dashboard-api/leads?limit=50`, {
          credentials: 'include',
        });
        if (res.ok) {
          const body = await res.json();
          if (body.success) {
            const leads = body.data.leads || [];
            setStatus({
              totalLeads: leads.length,
              contacted: leads.filter(
                (l: { status: string }) => l.status === 'contacted' || l.status === 'replied'
              ).length,
              replied: leads.filter((l: { status: string }) => l.status === 'replied').length,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load campaigns', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchCampaignStats();
  }, [activeWorkspace, apiUrl]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-[#1a2740] pb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Outreach Campaigns</h1>
          <p className="text-xs text-slate-400 mt-1">
            CAN-SPAM & GDPR compliant outbound sequences for {activeWorkspace?.workspace.name}.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Loading campaign state...</div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Engine Active
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Autonomous Inbound Opportunity Sequence #1
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Multi-touch personalized outreach crafted by local LLM & website audit insights.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-[#111c30] border border-[#1d2c48] text-slate-300 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5 text-orange-400" /> Ready to Dispatch
                  </span>
                </div>
              </div>

              {/* Progress metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#17253e]">
                <div className="p-4 rounded-xl bg-[#080d19] border border-[#142036]">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Target Prospects
                  </span>
                  <div className="text-2xl font-bold text-white mt-1">{status.totalLeads}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#080d19] border border-[#142036]">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Contacted
                  </span>
                  <div className="text-2xl font-bold text-orange-400 mt-1">{status.contacted}</div>
                </div>
                <div className="p-4 rounded-xl bg-[#080d19] border border-[#142036]">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Responses Received
                  </span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{status.replied}</div>
                </div>
              </div>
            </div>

            {/* Compliance Policy Status Box */}
            <div className="p-5 rounded-2xl bg-[#0a1220] border border-[#172640] flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-white">Compliance Safeguard Active</p>
                <p className="text-slate-400 leading-relaxed">
                  Every outbound sequence automatically includes one-click unsubscribe headers,
                  checks the suppression blacklist, and limits dispatch velocity to comply with
                  zero-cost SMTP sending limits.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
