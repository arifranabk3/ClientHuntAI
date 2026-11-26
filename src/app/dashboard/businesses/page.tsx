'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Building2, Globe, ExternalLink, ShieldCheck } from 'lucide-react';

interface Business {
  domain: string;
  companyNames: string[];
  totalLeads: number;
}

export default function BusinessesPage() {
  const { activeWorkspace } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!activeWorkspace) return;
    const loadBusinesses = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/dashboard-api/leads?limit=50`, {
          credentials: 'include',
        });
        if (res.ok) {
          const body = await res.json();
          if (body.success) {
            const leads = body.data.leads || [];
            const domainMap = new Map<string, { companyNames: Set<string>; count: number }>();

            for (const lead of leads) {
              const dom = lead.domain.toLowerCase();
              if (!domainMap.has(dom)) {
                domainMap.set(dom, { companyNames: new Set(), count: 0 });
              }
              const entry = domainMap.get(dom)!;
              entry.companyNames.add(lead.companyName);
              entry.count += 1;
            }

            const list: Business[] = Array.from(domainMap.entries()).map(([domain, data]) => ({
              domain,
              companyNames: Array.from(data.companyNames),
              totalLeads: data.count,
            }));

            setBusinesses(list);
          }
        }
      } catch (err) {
        console.error('Failed to load businesses', err);
      } finally {
        setLoading(false);
      }
    };
    void loadBusinesses();
  }, [activeWorkspace, apiUrl]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="border-b border-[#1a2740] pb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Audited Businesses</h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated corporate domains discovered in workspace: {activeWorkspace?.workspace.name}.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">Aggregating businesses...</div>
        ) : businesses.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-3">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No businesses tracked</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add prospects in the Lead Explorer to aggregate business entities here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((biz) => (
              <div
                key={biz.domain}
                className="p-5 rounded-2xl bg-[#0c1424] border border-[#17253e] hover:border-orange-500/30 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-orange-400" />
                    <span className="font-mono text-sm font-bold text-white">{biz.domain}</span>
                  </div>
                  <a
                    href={`https://${biz.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-white"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="text-xs text-slate-300 font-medium">
                  {biz.companyNames.join(', ')}
                </div>

                <div className="pt-2 border-t border-[#17253e] flex items-center justify-between text-[11px] text-slate-400">
                  <span>{biz.totalLeads} Lead Record(s)</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> Zero-Cost Audited
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
