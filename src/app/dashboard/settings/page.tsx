'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { UserPlus, Shield } from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
}

export default function SettingsPage() {
  const { activeWorkspace, csrfToken } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'workspace_admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const loadMembers = async () => {
    if (!activeWorkspace) return;
    setLoadingMembers(true);
    try {
      const res = await fetch(`${apiUrl}/dashboard-api/members`, { credentials: 'include' });
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setMembers(body.data.members || []);
        }
      }
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    void loadMembers();
  }, [activeWorkspace]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !csrfToken) return;
    setInviting(true);
    setMessage(null);

    try {
      const res = await fetch(`${apiUrl}/workspaces/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
        credentials: 'include',
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        setMessage({
          type: 'error',
          text: body.error?.message || 'Failed to add member to workspace',
        });
        return;
      }

      setInviteEmail('');
      setMessage({ type: 'success', text: 'Member successfully added to this workspace!' });
      void loadMembers();
    } catch {
      setMessage({ type: 'error', text: 'Connection failed' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-[#1a2740] pb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Workspace Settings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage membership, tenant role assignments, and policies for{' '}
            {activeWorkspace?.workspace.name}.
          </p>
        </div>

        {/* Tenant Information Card */}
        <section className="p-6 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Tenant Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                Workspace Name
              </span>
              <p className="text-sm text-white font-medium mt-0.5">
                {activeWorkspace?.workspace.name}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                Unique Tenant Slug
              </span>
              <p className="text-sm text-orange-400 font-mono mt-0.5">
                {activeWorkspace?.workspace.slug}
              </p>
            </div>
          </div>
        </section>

        {/* Add Member Form */}
        <section className="p-6 rounded-2xl bg-[#0c1424] border border-[#17253e] space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Add Member to Workspace
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Grant a registered user access to this workspace database.
          </p>

          {message && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                message.type === 'success'
                  ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                  : 'bg-red-950 border-red-800 text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="px-3 py-2 bg-[#070b14] border border-[#1c2c47] rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'workspace_admin' | 'member')}
              className="px-3 py-2 bg-[#070b14] border border-[#1c2c47] rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="member">Member</option>
              <option value="workspace_admin">Workspace Admin</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="py-2 px-4 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg text-xs transition disabled:opacity-50"
            >
              {inviting ? 'Adding...' : 'Grant Access'}
            </button>
          </form>
        </section>

        {/* Members List */}
        <section className="rounded-2xl bg-[#0c1424] border border-[#17253e] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#17253e] flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Workspace Roster ({members.length})
            </h2>
            <Shield className="w-4 h-4 text-slate-400" />
          </div>

          {loadingMembers ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading roster...</div>
          ) : (
            <div className="divide-y divide-[#17253e]">
              {members.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{m.name}</p>
                    <p className="text-slate-400 text-[11px] font-mono">{m.email}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-[#111a2e] border border-[#1e2d48] text-orange-400">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
