import React from 'react';
import { ShieldCheck, ShieldAlert, CreditCard, Terminal, Award, FileSpreadsheet, MessageSquareQuote, Sun, Moon, Github } from 'lucide-react';

export type ActiveTab = 'mission' | 'scenarios' | 'ledger' | 'evals' | 'judge' | 'ask';

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
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      {/* Sandbox Notice Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-amber-500/20 border-b border-amber-500/30 px-4 py-1.5 text-center text-xs font-mono font-medium text-amber-300 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span>PAYPAL DEVELOPER SANDBOX ENVIRONMENT &bull; NO REAL MONEY MOVES &bull; DETERMINISTIC POLICY ACTIVE</span>
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
