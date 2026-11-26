'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ExternalLink,
  Globe,
} from 'lucide-react';

interface Lead {
  id: string;
  companyName: string;
  domain: string;
  status: string;
  createdAt: string;
}

export default function LeadExplorerPage() {
  const { activeWorkspace, csrfToken } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Add lead modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchLeads = async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status: statusFilter,
      });

      const res = await fetch(`${apiUrl}/dashboard-api/leads?${query.toString()}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setLeads(body.data.leads || []);
          setTotal(body.data.total || 0);
          setTotalPages(body.data.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load leads', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLeads();
  }, [activeWorkspace, page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void fetchLeads();
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany || !newDomain || !csrfToken) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ companyName: newCompany.trim(), domain: newDomain.trim() }),
        credentials: 'include',
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message || 'Failed to add lead');
        return;
      }

      setNewCompany('');
      setNewDomain('');
      setModalOpen(false);
      void fetchLeads();
    } catch {
      setError('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!csrfToken || !confirm('Are you sure you want to delete this prospect?')) return;
    try {
      const res = await fetch(`${apiUrl}/leads/${id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
        credentials: 'include',
      });
      if (res.ok) {
        void fetchLeads();
      }
    } catch (err) {
      console.error('Failed to delete lead', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1a2740] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Lead Explorer</h1>
            <p className="text-xs text-slate-400 mt-1">
              Search, filter, and audit target enterprise accounts in{' '}
              {activeWorkspace?.workspace.name}.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-orange-950/50 transition self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Prospect
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-xl bg-[#0c1424] border border-[#17253e] flex flex-col md:flex-row gap-4 justify-between items-center">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by company or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#070b14] border border-[#1c2c47] rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </form>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#070b14] border border-[#1c2c47] rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="replied">Replied</option>
              <option value="won">Won Deal</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="rounded-2xl bg-[#0c1424] border border-[#17253e] overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Loading workspace prospects...
            </div>
          ) : leads.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Globe className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">No prospects found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No leads match your search criteria. Add target companies to begin discovery.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#09101d] text-[11px] uppercase font-bold text-slate-400 border-b border-[#17253e]">
                  <tr>
                    <th className="px-6 py-3.5">Company Name</th>
                    <th className="px-6 py-3.5">Domain</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Discovered</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17253e]">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#101a2f]/50 transition">
                      <td className="px-6 py-4 font-semibold text-white">{lead.companyName}</td>
                      <td className="px-6 py-4">
                        <a
                          href={`https://${lead.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-orange-400 hover:underline flex items-center gap-1"
                        >
                          {lead.domain} <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            lead.status === 'qualified'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : lead.status === 'won'
                                ? 'bg-orange-950 text-orange-400 border border-orange-800'
                                : 'bg-[#121c30] text-slate-300 border border-[#1e2f4e]'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => void handleDeleteLead(lead.id)}
                          className="p-1 rounded text-slate-500 hover:text-red-400 transition"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-6 py-3 border-t border-[#17253e] flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {leads.length} of {total} leads
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded bg-[#070b14] border border-[#1c2c47] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded bg-[#070b14] border border-[#1c2c47] disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Add Prospect Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0c1424] border border-[#1b2944] rounded-2xl p-6 shadow-2xl">
              <h3 className="text-base font-bold text-white mb-2">Add New Prospect</h3>
              <p className="text-xs text-slate-400 mb-4">
                Record a target domain to run zero-cost audit & discovery routines.
              </p>

              {error && (
                <div className="p-3 mb-4 rounded-lg bg-red-950 border border-red-800 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleAddLead} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Studio"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b14] border border-[#1f2e4b] rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Website Domain
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. acme.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b14] border border-[#1f2e4b] rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-xs bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Add Lead'}
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
