'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Sparkles, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message || 'Login failed. Please check your credentials.');
        return;
      }

      await refreshSession();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error. Could not connect to API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] text-[#F8FAFC] px-4 selection:bg-[#FF8A3D]/30 selection:text-white relative overflow-hidden">
      {/* Background glowing spheres */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF8A3D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 sm:p-10 bg-[#151F30] border border-[#243447] rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FF8A3D]/10 text-[#FF8A3D] border border-[#FF8A3D]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Client Acquisition</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">ClientHunt AI</h1>
          <p className="text-xs text-[#A6B2C3]">
            Sign in to access your agency workspace and client pipeline
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#A6B2C3] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@agency.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-[#1E293B] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#FF8A3D] transition shadow-inner"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-[#A6B2C3] uppercase tracking-wider">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-[#1E293B] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#FF8A3D] transition shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-[#FF8A3D] hover:bg-[#FF9B57] text-white font-bold text-xs flex items-center justify-center gap-2 transition duration-200 shadow-md shadow-[#FF8A3D]/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#1E293B] flex items-center justify-between text-xs text-[#A6B2C3]">
          <span>New agency account?</span>
          <Link
            href="/register"
            className="text-[#FF8A3D] hover:text-[#FF9B57] font-semibold transition"
          >
            Create Workspace
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#718096]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>Multi-tenant encrypted database partition</span>
        </div>
      </div>
    </div>
  );
}
