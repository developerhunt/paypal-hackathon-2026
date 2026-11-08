import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Terminal,
  Award,
  FileSpreadsheet,
  MessageSquareQuote,
  Sun,
  Moon,
  Github,
  Activity,
  Cpu,
  Layers,
  CheckCircle,
} from 'lucide-react';

export type ActiveTab = 'mission' | 'scenarios' | 'ledger' | 'evals' | 'judge' | 'ask';

export interface SystemStatusData {
  paypal: { mode: 'LIVE_SANDBOX' | 'MOCK'; environment: string; description?: string };
  gemini: { mode: 'LIVE' | 'MOCK'; model: string };
  channel3: { mode: 'LIVE' | 'MOCK_FIXTURE'; description?: string };
  ledger: { mode: string; storage: string; chainValid: boolean; entriesCount: number };
  build?: { version: string; timestamp: string };
}

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  stats?: {
    totalSpent: number;
    blockedCount: number;
    capturedCount: number;
  };
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  darkMode,
  setDarkMode,
}) => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStatus(data);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      {/* Sandbox Notice Banner with Subsystem Live/Mock Indicators */}
      <div className="bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 text-xs font-mono flex flex-wrap items-center justify-between gap-2 text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-amber-300 font-bold tracking-tight">PAYPAL SANDBOX</span>
          <span className="text-zinc-500 hidden sm:inline">&bull; No real money moves</span>
        </div>

        {/* Dynamic Subsystem Health Badges */}
        <div className="flex items-center gap-2 text-[10px]">
          <span
            className={`px-1.5 py-0.5 rounded font-bold border ${
              status?.paypal.mode === 'LIVE_SANDBOX'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title={status?.paypal.description || 'PayPal Integration'}
          >
            PayPal: {status?.paypal.mode === 'LIVE_SANDBOX' ? '● LIVE SANDBOX' : '○ MOCK FIXTURE'}
          </span>

          <span
            className={`px-1.5 py-0.5 rounded font-bold border ${
              status?.gemini.mode === 'LIVE'
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/40'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title={`Gemini Model: ${status?.gemini.model || 'gemini-2.5-flash'}`}
          >
            Gemini: {status?.gemini.mode === 'LIVE' ? '● LIVE (2.5-flash)' : '○ DETERMINISTIC'}
          </span>

          <span
            className={`px-1.5 py-0.5 rounded font-bold border ${
              status?.channel3.mode === 'LIVE'
                ? 'bg-teal-950/60 text-teal-300 border-teal-500/40'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title={status?.channel3.description || 'Commerce Catalog'}
          >
            Channel3: {status?.channel3.mode === 'LIVE' ? '● LIVE' : '○ VERIFIED CATALOG'}
          </span>

          <span
            className={`hidden md:inline px-1.5 py-0.5 rounded font-bold border ${
              status?.ledger.chainValid
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
            }`}
            title="SHA-256 Hash Chain Integrity"
          >
            Ledger: {status?.ledger.chainValid ? '✓ SHA-256 HASH-CHAINED' : '✗ CHAIN TAMPERED'}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('mission')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  LEASH
                </span>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  v1.0-paypal
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans hidden sm:block">
                Trust &amp; Control Layer for AI Shopping Agents
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('mission')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'mission'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Mission Control</span>
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'scenarios'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Demo Scenarios (A-F)</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>AG Grid Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('evals')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'evals'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Trust &amp; Evals</span>
          </button>

          <button
            onClick={() => setActiveTab('judge')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'judge'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/30 border border-amber-500/20'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Judge Tour</span>
          </button>

          <button
            onClick={() => setActiveTab('ask')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ask'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>Ask Leash</span>
          </button>
        </nav>

        {/* Quick Telemetry & Mode */}
        <div className="flex items-center gap-3">
          {stats && (
            <div className="hidden lg:flex items-center gap-3 text-xs font-mono bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-zinc-800">
              <span className="text-zinc-400">
                Captured:{' '}
                <strong className="text-emerald-400">${stats.totalSpent.toFixed(2)}</strong>
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-400">
                Blocked:{' '}
                <strong className="text-rose-400">{stats.blockedCount}</strong>
              </span>
            </div>
          )}

          <a
            href="https://github.com/developerhunt/paypal-hackathon-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors"
            title="View on GitHub: developerhunt/paypal-hackathon-2026"
            aria-label="View on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors"
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
