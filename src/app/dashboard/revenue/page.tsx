'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/components/AuthContext';
import {
  DollarSign,
  TrendingUp,
  FileText,
  CreditCard,
  PieChart,
  Repeat,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface CurrencyBreakdown {
  currency: string;
  totalExpected: number;
  totalInvoiced: number;
  totalCollected: number;
  totalOutstanding: number;
  totalRefunded: number;
  mrr: number;
  transactionCount: number;
}

interface FunnelMetrics {
  discoveredLeads: number;
  qualifiedLeads: number;
  outreachDraftsCreated: number;
  outreachDraftsApproved: number;
  outreachSent: number;
  repliesReceived: number;
  positiveReplies: number;
  proposalsSubmitted: number;
  dealsWon: number;
  dealsLost: number;
  qualificationRate: number;
  outreachApprovalRate: number;
  replyRate: number;
  dealWinRate: number;
  overallFunnelConversionRate: number;
}

interface RevenueOverview {
  currencyBreakdowns: CurrencyBreakdown[];
  funnel: FunnelMetrics;
  revenueByClient: Array<{
    clientName: string;
    totalCollected: number;
    currency: string;
    transactionsCount: number;
  }>;
  revenueByCategory: Array<{
    category: string;
    totalCollected: number;
    currency: string;
    count: number;
  }>;
  revenueByChannel: Array<{
    channel: string;
    totalCollected: number;
    currency: string;
    dealsWon: number;
  }>;
  activeRecurringPlansCount: number;
  recentTransactions: Array<{
    _id: string;
    invoiceReference: string;
    clientName: string;
    serviceCategory: string;
    currency: string;
    amountExpected: number;
    amountInvoiced: number;
    amountCollected: number;
    amountRefunded: number;
    paymentStatus: string;
    acquisitionChannel: string;
    createdAt: string;
  }>;
}

export default function RevenueIntelligencePage() {
  const { activeWorkspace, csrfToken } = useAuth();
  const [data, setData] = useState<RevenueOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'transactions' | 'recurring' | 'reports'>('overview');

  // Transaction form states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [invoiceReference, setInvoiceReference] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceCategory, setServiceCategory] = useState('web_development');
  const [currency, setCurrency] = useState('USD');
  const [amountExpected, setAmountExpected] = useState('');
  const [amountInvoiced, setAmountInvoiced] = useState('');
  const [amountCollected, setAmountCollected] = useState('');
  const [acquisitionChannel, setAcquisitionChannel] = useState('cold_email');
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchOverview = async () => {
    if (!activeWorkspace?.workspace?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/revenue/overview`,
        { credentials: 'include' }
      );
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || 'Failed to load revenue overview');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching revenue intelligence data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [activeWorkspace?.workspace?.id]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace?.workspace?.id) return;

    try {
      setSubmitting(true);
      const res = await fetch(
        `${apiUrl}/api/workspaces/${activeWorkspace.workspace.id}/revenue/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || '',
          },
          credentials: 'include',
          body: JSON.stringify({
            invoiceReference,
            clientName,
            description,
            serviceCategory,
            currency,
            amountExpected: parseFloat(amountExpected) || 0,
            amountInvoiced: parseFloat(amountInvoiced) || 0,
            amountCollected: parseFloat(amountCollected) || 0,
            acquisitionChannel,
          }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setInvoiceReference('');
        setClientName('');
        setDescription('');
        setAmountExpected('');
        setAmountInvoiced('');
        setAmountCollected('');
        fetchOverview();
      } else {
        alert(json.error?.message || 'Failed to record transaction');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const primaryBreakdown = data?.currencyBreakdowns?.[0] || {
    currency: 'USD',
    totalExpected: 0,
    totalInvoiced: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    totalRefunded: 0,
    mrr: 0,
    transactionCount: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <DollarSign className="h-7 w-7 text-emerald-600" />
              Agency Revenue Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sales pipeline conversion, collected revenue, outstanding balances, and recurring maintenance revenue.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchOverview()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md hover:bg-muted transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
            >
              <Plus className="h-4 w-4" />
              Record Invoice / Payment
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-card border rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-sm font-medium">Collected Revenue</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {primaryBreakdown.currency} {primaryBreakdown.totalCollected.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Confirmed payments across {primaryBreakdown.transactionCount} transactions
            </p>
          </div>

          <div className="p-5 bg-card border rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-sm font-medium">Outstanding Balances</span>
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {primaryBreakdown.currency} {primaryBreakdown.totalOutstanding.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Invoiced balances awaiting collection
            </p>
          </div>

          <div className="p-5 bg-card border rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-sm font-medium">Monthly Recurring (MRR)</span>
              <Repeat className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {primaryBreakdown.currency} {primaryBreakdown.mrr.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {data?.activeRecurringPlansCount || 0} active maintenance retainers
            </p>
          </div>

          <div className="p-5 bg-card border rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-sm font-medium">Funnel Win Rate</span>
              <TrendingUp className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {data?.funnel.dealWinRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.funnel.dealsWon || 0} won vs {data?.funnel.dealsLost || 0} lost deals
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b space-x-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Revenue Breakdown
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'funnel'
                ? 'border-emerald-600 text-emerald-600 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Sales Funnel Analytics
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'transactions'
                ? 'border-emerald-600 text-emerald-600 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Transactions ({data?.recentTransactions?.length || 0})
          </button>
        </div>

        {/* Tab 1: Overview Breakdown */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Currency Breakdown Table */}
            <div className="p-5 bg-card border rounded-xl">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-600" />
                Multi-Currency Financial Summary
              </h3>
              {data?.currencyBreakdowns && data.currencyBreakdowns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2 font-medium">Currency</th>
                        <th className="pb-2 font-medium">Invoiced</th>
                        <th className="pb-2 font-medium">Collected</th>
                        <th className="pb-2 font-medium">Outstanding</th>
                        <th className="pb-2 font-medium">MRR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.currencyBreakdowns.map((b) => (
                        <tr key={b.currency} className="hover:bg-muted/50">
                          <td className="py-2.5 font-bold text-foreground">{b.currency}</td>
                          <td className="py-2.5">{b.totalInvoiced.toLocaleString()}</td>
                          <td className="py-2.5 font-semibold text-emerald-600">{b.totalCollected.toLocaleString()}</td>
                          <td className="py-2.5 text-amber-600">{b.totalOutstanding.toLocaleString()}</td>
                          <td className="py-2.5 text-blue-600">{b.mrr.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">No financial transaction records found.</p>
              )}
            </div>

            {/* Revenue by Client */}
            <div className="p-5 bg-card border rounded-xl">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-600" />
                Revenue by Client
              </h3>
              {data?.revenueByClient && data.revenueByClient.length > 0 ? (
                <div className="space-y-3">
                  {data.revenueByClient.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20">
                      <div>
                        <span className="font-medium text-foreground">{c.clientName}</span>
                        <span className="text-xs text-muted-foreground block">{c.transactionsCount} payments recorded</span>
                      </div>
                      <span className="font-semibold text-emerald-600">
                        {c.currency} {c.totalCollected.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">No client payment data recorded yet.</p>
              )}
            </div>

            {/* Revenue by Service Category */}
            <div className="p-5 bg-card border rounded-xl">
              <h3 className="text-base font-semibold mb-3">Revenue by Service Category</h3>
              {data?.revenueByCategory && data.revenueByCategory.length > 0 ? (
                <div className="space-y-2">
                  {data.revenueByCategory.map((cat, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
                      <span className="capitalize">{cat.category.replace('_', ' ')}</span>
                      <span className="font-semibold text-foreground">
                        {cat.currency} {cat.totalCollected.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">No categorized revenue records.</p>
              )}
            </div>

            {/* Revenue by Acquisition Channel */}
            <div className="p-5 bg-card border rounded-xl">
              <h3 className="text-base font-semibold mb-3">Revenue by Acquisition Channel</h3>
              {data?.revenueByChannel && data.revenueByChannel.length > 0 ? (
                <div className="space-y-2">
                  {data.revenueByChannel.map((ch, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
                      <span className="capitalize">{ch.channel.replace('_', ' ')}</span>
                      <span className="font-semibold text-foreground">
                        {ch.currency} {ch.totalCollected.toLocaleString()} ({ch.dealsWon} won)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4">No channel performance data yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Sales Funnel Analytics */}
        {activeTab === 'funnel' && data?.funnel && (
          <div className="p-6 bg-card border rounded-xl">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Verified Sales Funnel Telemetry
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-muted/30 border rounded-lg text-center">
                <span className="text-xs text-muted-foreground block">Discovered</span>
                <span className="text-xl font-bold text-foreground">{data.funnel.discoveredLeads}</span>
              </div>
              <div className="p-4 bg-muted/30 border rounded-lg text-center">
                <span className="text-xs text-muted-foreground block">Qualified</span>
                <span className="text-xl font-bold text-foreground">{data.funnel.qualifiedLeads}</span>
                <span className="text-[11px] text-emerald-600 block mt-0.5">{data.funnel.qualificationRate}% rate</span>
              </div>
              <div className="p-4 bg-muted/30 border rounded-lg text-center">
                <span className="text-xs text-muted-foreground block">Sent Outreach</span>
                <span className="text-xl font-bold text-foreground">{data.funnel.outreachSent}</span>
              </div>
              <div className="p-4 bg-muted/30 border rounded-lg text-center">
                <span className="text-xs text-muted-foreground block">Replies</span>
                <span className="text-xl font-bold text-foreground">{data.funnel.repliesReceived}</span>
                <span className="text-[11px] text-emerald-600 block mt-0.5">{data.funnel.replyRate}% rate</span>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                <span className="text-xs text-emerald-800 block">Deals Won</span>
                <span className="text-xl font-bold text-emerald-700">{data.funnel.dealsWon}</span>
                <span className="text-[11px] text-emerald-600 block mt-0.5">{data.funnel.dealWinRate}% win rate</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/20 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Strict Funnel Definitions:</p>
              <p>• Generated outreach drafts are not counted as sent messages until confirmed via manual sending.</p>
              <p>• Conversion denominators strictly correspond to actual database entries.</p>
            </div>
          </div>
        )}

        {/* Tab 3: Transactions */}
        {activeTab === 'transactions' && (
          <div className="p-5 bg-card border rounded-xl">
            <h3 className="text-base font-semibold mb-4">Financial Transactions</h3>
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-3 font-medium">Invoice Ref</th>
                      <th className="pb-3 font-medium">Client</th>
                      <th className="pb-3 font-medium">Category</th>
                      <th className="pb-3 font-medium">Amount Invoiced</th>
                      <th className="pb-3 font-medium">Collected</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.recentTransactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-muted/40">
                        <td className="py-3 font-mono text-xs">{tx.invoiceReference}</td>
                        <td className="py-3 font-medium">{tx.clientName}</td>
                        <td className="py-3 capitalize text-xs">{tx.serviceCategory.replace('_', ' ')}</td>
                        <td className="py-3">{tx.currency} {tx.amountInvoiced.toLocaleString()}</td>
                        <td className="py-3 font-semibold text-emerald-600">{tx.currency} {tx.amountCollected.toLocaleString()}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx.paymentStatus === 'collected'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.paymentStatus === 'invoiced'
                              ? 'bg-blue-100 text-blue-800'
                              : tx.paymentStatus === 'refunded'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No transactions recorded yet.</p>
            )}
          </div>
        )}

        {/* Add Transaction Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card border rounded-xl max-w-md w-full p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">Record Revenue Transaction</h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="text-xs font-medium block mb-1">Invoice Reference *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-001"
                    value={invoiceReference}
                    onChange={(e) => setInvoiceReference(e.target.value)}
                    className="w-full text-sm border rounded-md px-3 py-2 bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full text-sm border rounded-md px-3 py-2 bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Website Redesign & SEO"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm border rounded-md px-3 py-2 bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1">Currency</label>
                    <input
                      type="text"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full text-sm border rounded-md px-3 py-2 bg-background uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Service Category</label>
                    <select
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      className="w-full text-sm border rounded-md px-3 py-2 bg-background"
                    >
                      <option value="web_development">Web Development</option>
                      <option value="website_design">Website Design</option>
                      <option value="seo_optimization">SEO Optimization</option>
                      <option value="monthly_maintenance">Monthly Maintenance</option>
                      <option value="retainer">Retainer</option>
                      <option value="consulting">Consulting</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1">Invoiced Amount</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amountInvoiced}
                      onChange={(e) => setAmountInvoiced(e.target.value)}
                      className="w-full text-sm border rounded-md px-3 py-2 bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">Collected Amount</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amountCollected}
                      onChange={(e) => setAmountCollected(e.target.value)}
                      className="w-full text-sm border rounded-md px-3 py-2 bg-background"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                  >
                    {submitting ? 'Saving...' : 'Save Transaction'}
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
