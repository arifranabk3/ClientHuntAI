import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  Globe,
  BrainCircuit,
  Send,
  Kanban,
  DollarSign,
  ShieldCheck,
  Layers,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      title: 'Autonomous Lead Engine',
      desc: 'Free OSM, DuckDuckGo & public directory discovery pipelines without paid API keys.',
      icon: Search,
      tag: 'Zero-Cost Ingestion',
    },
    {
      title: 'Deep Website Analyzer',
      desc: 'Headless tech stack detection, SSL audits, responsive checks, and performance scoring.',
      icon: Globe,
      tag: 'Evidence-Based',
    },
    {
      title: 'AI Value Proposition Engine',
      desc: 'Generates evidence-backed audit reports, customized pitches, and personalized angles.',
      icon: BrainCircuit,
      tag: 'Multi-LLM Native',
    },
    {
      title: 'Compliant Outreach Hub',
      desc: 'Human-in-the-loop review, automated follow-up drafts, and strict suppression rules.',
      icon: Send,
      tag: 'CAN-SPAM / GDPR Safe',
    },
    {
      title: 'Enterprise CRM Pipeline',
      desc: 'Full-stage deal tracking, contact management, notes, tasks, and conversion analytics.',
      icon: Kanban,
      tag: 'Multi-Tenant Isolated',
    },
    {
      title: 'Revenue & SaaS Subscriptions',
      desc: 'Track MRR, recurring contracts, quota entitlements, and automated client retention.',
      icon: DollarSign,
      tag: 'Financial Accuracy',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-[#F8FAFC] selection:bg-[#FF8A3D]/30 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF8A3D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#0B1120]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF8A3D] to-amber-400 flex items-center justify-center text-white shadow-lg shadow-[#FF8A3D]/25 font-bold text-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-[#F8FAFC]">ClientHunt</span>
              <span className="text-[#FF8A3D] font-bold text-base"> AI</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-medium text-[#A6B2C3] hover:text-[#F8FAFC] px-3 py-1.5 rounded-lg hover:bg-[#151F30] transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-[#FF8A3D] to-amber-500 hover:from-[#FF9B57] hover:to-amber-400 text-white shadow-lg shadow-[#FF8A3D]/20 transition flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#151F30] text-[#FF8A3D] border border-[#243447] mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Client Discovery &amp; Retention Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F8FAFC] leading-[1.1] mb-6">
            Enterprise Client Acquisition{' '}
            <span className="bg-gradient-to-r from-[#FF8A3D] via-amber-400 to-[#FF9B57] bg-clip-text text-transparent">
              Without Paid APIs
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#A6B2C3] leading-relaxed mb-8 max-w-2xl mx-auto">
            Autonomous prospecting, evidence-based website audits, compliant outreach drafting, CRM pipeline tracking, and recurring client retention engine.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF8A3D] to-amber-500 hover:from-[#FF9B57] hover:to-amber-400 text-white font-semibold text-sm shadow-xl shadow-[#FF8A3D]/25 transition flex items-center justify-center gap-2"
            >
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#151F30] hover:bg-[#1C293B] text-[#F8FAFC] border border-[#243447] font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="group p-6 rounded-2xl bg-[#151F30]/80 hover:bg-[#1C293B] border border-[#243447] hover:border-[#FF8A3D]/40 transition duration-300 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-[#243447] flex items-center justify-center text-[#FF8A3D] group-hover:scale-105 group-hover:border-[#FF8A3D]/40 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#0B1120] text-[#A6B2C3] border border-[#243447]">
                    {feat.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#F8FAFC] group-hover:text-white transition mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs text-[#A6B2C3] leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>

        {/* System Status Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#151F30] via-[#1C293B] to-[#151F30] border border-[#243447] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <h4 className="text-sm font-semibold text-[#F8FAFC]">Multi-Tenant Engine Status</h4>
              <p className="text-xs text-[#A6B2C3]">
                Zero-Cost Monorepo Active • MongoDB Atlas Connected • Background Workers Ready
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#FF8A3D] hover:text-[#FF9B57] flex items-center gap-1.5 transition whitespace-nowrap"
          >
            Launch System <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] bg-[#0B1120] py-8 text-center text-xs text-[#718096]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ClientHunt AI. Enterprise-Grade Autonomous Client Acquisition.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#A6B2C3] transition">Login</Link>
            <Link href="/register" className="hover:text-[#A6B2C3] transition">Register</Link>
            <Link href="/dashboard" className="hover:text-[#A6B2C3] transition">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
