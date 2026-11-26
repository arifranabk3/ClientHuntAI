'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    workspaceName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message || 'Registration failed. Please check inputs.');
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
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-lg p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Workspace</h1>
          <p className="text-sm text-slate-400 mt-1">Start autonomous client acquisition</p>
        </div>

        {error && (
          <div className="p-3 mb-6 bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Work Email
            </label>
            <input
              type="email"
              required
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="jane@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              name="workspaceName"
              value={formData.workspaceName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="Acme Growth"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Password (min. 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition disabled:opacity-50 mt-4"
          >
            {isSubmitting ? 'Registering Workspace...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
