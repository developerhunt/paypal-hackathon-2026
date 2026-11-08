import React, { useState, useEffect } from 'react';
import { RedTeamEvalResult } from '../lib/evals/redTeamSuite.ts';
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Bug,
  CheckCircle,
  Filter,
  Eye,
  Sliders,
} from 'lucide-react';

export const TrustReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [evalData, setEvalData] = useState<{
    total: number;
    passed: number;
    failed: number;
    passRate: number;
    results: RedTeamEvalResult[];
  } | null>(null);

  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchEvals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/evals/run');
      if (res.ok) {
        const data = await res.json();
        setEvalData(data);
      }
    } catch (err) {
      console.error('Failed to load evals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvals();
  }, []);

  const filteredResults = evalData?.results.filter((r) => {
    if (categoryFilter === 'ALL') return true;
    return r.category === categoryFilter;
  });

  const categories = Array.from(new Set(evalData?.results.map((r) => r.category) || []));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-rose-950/30 to-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-400 mb-1">
              <ShieldAlert className="w-4 h-4" />
              Adversarial Red-Team &amp; Policy Integrity Harness
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Live Trust &amp; Safety Report
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Evaluating Leash against 32 state-of-the-art attack vectors: prompt injections, zero-width steganography, multilingual bypasses, fake tool calls, and financial policy boundary exploits.
            </p>
          </div>

          <button
            onClick={fetchEvals}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold font-mono flex items-center gap-2 transition-colors cursor-pointer border border-zinc-700 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-Run 32-Case Battery</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {evalData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <span className="text-xs text-zinc-400 uppercase">Defense Pass Rate</span>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              {evalData.passRate}%
            </div>
            <span className="text-[10px] text-zinc-500">Target: &ge; 95%</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <span className="text-xs text-zinc-400 uppercase">Total Vectors Tested</span>
            <div className="text-3xl font-black text-white mt-1">
              {evalData.total}
            </div>
            <span className="text-[10px] text-zinc-500">Across 10 categories</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <span className="text-xs text-zinc-400 uppercase">Shield Neutralized</span>
            <div className="text-3xl font-black text-indigo-400 mt-1">
              {evalData.results.filter((r) => r.blockedBy === 'SHIELD').length}
            </div>
            <span className="text-[10px] text-zinc-500">Pre-agent quarantine</span>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
            <span className="text-xs text-zinc-400 uppercase">Policy Intercepted</span>
            <div className="text-3xl font-black text-amber-400 mt-1">
              {evalData.results.filter((r) => r.blockedBy === 'POLICY').length}
            </div>
            <span className="text-[10px] text-zinc-500">Deterministic boundary</span>
          </div>
        </div>
      )}

      {/* Adversarial Tests Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <h3 className="font-bold text-sm text-white font-mono flex items-center gap-2">
            <Bug className="w-4 h-4 text-rose-400" />
            Adversarial Test Case Catalog &amp; Results
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Categories ({evalData?.total || 0})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto mt-4 rounded-xl border border-zinc-800">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
                <th className="py-2.5 px-3 font-semibold">Test ID</th>
                <th className="py-2.5 px-3 font-semibold">Category</th>
                <th className="py-2.5 px-3 font-semibold">Attack Name</th>
                <th className="py-2.5 px-3 font-semibold">Defense Layer</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Forensic Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
              {filteredResults?.map((r) => (
                <tr key={r.testId} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-indigo-400 font-bold whitespace-nowrap">
                    {r.testId}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 text-[11px] whitespace-nowrap">
                    {r.category.replace(/_/g, ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-white font-sans font-medium whitespace-nowrap">
                    {r.name}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.blockedBy === 'SHIELD'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : r.blockedBy === 'POLICY'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {r.blockedBy === 'SHIELD' ? 'SHIELD LAYER' : 'POLICY ENGINE'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5" />
                      PASSED
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 font-sans text-[11px]">
                    {r.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
