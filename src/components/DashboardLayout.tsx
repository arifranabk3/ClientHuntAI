'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { useTheme } from '@/components/ThemeContext';
import {
  LayoutDashboard,
  Search,
  Globe,
  BrainCircuit,
  Users,
  Send,
  Kanban,
  BarChart3,
  Settings,
  Calendar,
  ChevronDown,
  LogOut,
  Building,
  Menu,
  X,
  Plus,
  ShieldCheck,
  DollarSign,
  Layers,
  ChevronRight,
  Sparkles,
  Command,
} from 'lucide-react';

interface SidebarGroup {
  label: string;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

const navGroups: SidebarGroup[] = [
  {
    label: 'Platform',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Lead Discovery', href: '/dashboard/discovery', icon: Search },
      { name: 'Website Analyzer', href: '/dashboard/analysis', icon: Globe },
      { name: 'AI Intelligence', href: '/dashboard/intelligence', icon: BrainCircuit, badge: 'AI' },
      { name: 'USA Consulting', href: '/dashboard/usa-consulting', icon: Building },
    ],
  },
  {
    label: 'Pipeline & Sales',
    items: [
      { name: 'Lead Explorer', href: '/dashboard/leads', icon: Users },
      { name: 'Businesses', href: '/dashboard/businesses', icon: Building },
      { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
      { name: 'Campaigns', href: '/dashboard/campaigns', icon: Send },
      { name: 'Outreach Hub', href: '/dashboard/outreach', icon: Send },
      { name: 'CRM Pipeline', href: '/dashboard/crm', icon: Kanban },
    ],
  },
  {
    label: 'Agency & Revenue',
    items: [
      { name: 'Revenue & Sales', href: '/dashboard/revenue', icon: DollarSign },
      { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: Layers, badge: 'SaaS' },
      { name: 'Client Retention', href: '/dashboard/retention', icon: ShieldCheck },
      { name: 'Website Monitoring', href: '/dashboard/monitoring', icon: Globe },
      { name: 'Schedules', href: '/dashboard/schedules', icon: Calendar },
      { name: 'Contact Refresh', href: '/dashboard/contacts-refresh', icon: ShieldCheck },
      { name: 'Requalification', href: '/dashboard/requalification', icon: BrainCircuit },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { user, activeWorkspace, workspaces, logout, refreshSession, csrfToken } = useAuth();
  useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [wsSwitchOpen, setWsSwitchOpen] = useState(false);
  const [newWsModal, setNewWsModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleSwitchWorkspace = async (workspaceId: string) => {
    if (!csrfToken) return;
    try {
      const res = await fetch(`${apiUrl}/workspaces/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ workspaceId }),
        credentials: 'include',
      });
      if (res.ok) {
        setWsSwitchOpen(false);
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to switch workspace', err);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !csrfToken) return;
    setCreatingWs(true);
    try {
      const res = await fetch(`${apiUrl}/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ name: newWsName.trim() }),
        credentials: 'include',
      });
      if (res.ok) {
        setNewWsName('');
        setNewWsModal(false);
        await refreshSession();
      }
    } catch (err) {
      console.error('Failed to create workspace', err);
    } finally {
      setCreatingWs(false);
    }
  };

  // Derive active breadcrumb title
  const currentTitle =
    navGroups
      .flatMap((g) => g.items)
      .find((i) => i.href === pathname)?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#FF8A3D]/30 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#1E293B] bg-[#111827]/80 backdrop-blur-md px-4 lg:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-[#A6B2C3] hover:text-white hover:bg-[#1C293B] lg:hidden transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF8A3D] to-[#EA580C] flex items-center justify-center font-black text-white text-sm shadow-md shadow-[#FF8A3D]/20 transition-transform group-hover:scale-105">
              CH
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline flex items-center gap-1.5">
              ClientHunt
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#1C293B] text-[#FF8A3D] border border-[#243447]">
                AI
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-xs text-[#718096]">
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#A6B2C3] font-medium">{currentTitle}</span>
          </div>
        </div>

        {/* Global Search & Action Area */}
        <div className="flex items-center gap-3">
          {/* Quick Search Shortcut Display */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B1120] border border-[#1E293B] text-xs text-[#718096] w-64 shadow-inner">
            <Search className="w-3.5 h-3.5" />
            <span className="text-xs">Search prospects or domains...</span>
            <span className="ml-auto flex items-center text-[10px] font-mono px-1 py-0.5 rounded bg-[#151F30] border border-[#243447] text-[#A6B2C3]">
              <Command className="w-2.5 h-2.5 mr-0.5" /> K
            </span>
          </div>

          {/* Workspace Switcher dropdown */}
          <div className="relative">
            <button
              onClick={() => setWsSwitchOpen(!wsSwitchOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151F30] border border-[#243447] text-xs font-semibold text-[#F8FAFC] hover:border-[#FF8A3D]/50 hover:bg-[#1C293B] transition shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span className="max-w-[130px] truncate">
                {activeWorkspace?.workspace.name || 'Select Workspace'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#A6B2C3]" />
            </button>

            {wsSwitchOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-[#151F30] border border-[#243447] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-[#718096] border-b border-[#1E293B]">
                  Active Workspace
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {workspaces.map((w) => (
                    <button
                      key={w.workspace.id}
                      onClick={() => void handleSwitchWorkspace(w.workspace.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#1C293B] transition ${
                        activeWorkspace?.workspace.id === w.workspace.id
                          ? 'text-[#FF8A3D] font-bold bg-[#1C293B]/50'
                          : 'text-[#A6B2C3]'
                      }`}
                    >
                      <span className="truncate">{w.workspace.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#111827] border border-[#1E293B] text-[#718096]">
                        {w.role}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#1E293B] mt-1 pt-1.5 px-1">
                  <button
                    onClick={() => {
                      setWsSwitchOpen(false);
                      setNewWsModal(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#FF8A3D] hover:bg-[#1C293B] rounded-lg flex items-center gap-2 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Agency Workspace
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#151F30] transition text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#FF8A3D] to-[#F59E0B] flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {user?.firstName?.[0] || 'A'}
              </div>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#151F30] border border-[#243447] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3.5 py-2.5 border-b border-[#1E293B]">
                  <p className="text-xs font-bold text-[#F8FAFC] truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[11px] text-[#718096] truncate">{user?.email}</p>
                  <span className="inline-block mt-1.5 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-[#111827] text-[#FF8A3D] border border-[#FF8A3D]/30 font-mono">
                    {activeWorkspace?.role || 'owner'}
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/subscriptions"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#A6B2C3] hover:bg-[#1C293B] hover:text-[#F8FAFC]"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#FF8A3D]" />
                    Plan & Quota Limits
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#A6B2C3] hover:bg-[#1C293B] hover:text-[#F8FAFC]"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#A6B2C3]" />
                    Workspace Settings
                  </Link>
                </div>
                <div className="border-t border-[#1E293B] mt-1 pt-1 px-1">
                  <button
                    onClick={() => void logout()}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body with Linear-style Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="w-60 border-r border-[#1E293B] bg-[#111827] hidden lg:flex flex-col justify-between py-4 px-3 overflow-y-auto">
          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider uppercase text-[#718096]">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        active
                          ? 'bg-[#1C293B] text-[#FF8A3D] font-semibold border border-[#243447]'
                          : 'text-[#A6B2C3] hover:text-white hover:bg-[#151F30]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${active ? 'text-[#FF8A3D]' : 'text-[#718096]'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded bg-[#FF8A3D]/10 text-[#FF8A3D] border border-[#FF8A3D]/20">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-[#151F30] border border-[#243447] rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[#718096]">
              <span className="text-[10px] uppercase font-bold tracking-wider">Tenant Node</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                <span className="text-[10px] text-[#22C55E] font-medium">Online</span>
              </div>
            </div>
            <p className="text-[11px] text-[#F8FAFC] font-mono truncate">
              {activeWorkspace?.workspace.slug || 'local-tenant'}
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex animate-in fade-in">
            <div className="w-64 bg-[#111827] border-r border-[#1E293B] h-full p-4 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                  <span className="font-bold text-white text-sm">Navigation</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded text-[#718096] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#718096]">
                      {group.label}
                    </div>
                    {group.items.map((item) => {
                      const active = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                            active
                              ? 'bg-[#1C293B] text-[#FF8A3D] font-semibold border border-[#243447]'
                              : 'text-[#A6B2C3] hover:text-white hover:bg-[#151F30]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              <button
                onClick={() => void logout()}
                className="w-full mt-4 py-2 px-3 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl flex items-center justify-center gap-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0B1120] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* New Workspace Modal */}
      {newWsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#151F30] border border-[#243447] rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-[#FF8A3D] mb-1">
              <Sparkles className="w-4 h-4" />
              <h3 className="text-sm font-bold text-white">Create Agency Workspace</h3>
            </div>
            <p className="text-xs text-[#A6B2C3] mb-4">
              Initialize an isolated tenant database partition for client management and outreach.
            </p>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <input
                type="text"
                required
                placeholder="e.g. Apex Digital Growth"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                className="w-full px-3 py-2 bg-[#111827] border border-[#1E293B] rounded-xl text-xs text-[#F8FAFC] focus:outline-none focus:border-[#FF8A3D]"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewWsModal(false)}
                  className="px-3 py-1.5 text-xs text-[#718096] hover:text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWs}
                  className="px-4 py-1.5 text-xs bg-[#FF8A3D] hover:bg-[#FF9B57] text-white font-semibold rounded-lg disabled:opacity-50 transition shadow-sm"
                >
                  {creatingWs ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
