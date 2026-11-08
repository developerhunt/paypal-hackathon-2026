import React, { useState, useMemo } from 'react';
import { LedgerEntry } from '../types/ledger.ts';
import {
  Download,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Eye,
  CheckCircle,
  Copy,
  Clock,
  Sparkles,
} from 'lucide-react';

interface LedgerGridProps {
  entries: LedgerEntry[];
  onRefund: (ledgerId: string) => Promise<void>;
  onRefresh: () => void;
}

export const LedgerGrid: React.FC<LedgerGridProps> = ({ entries, onRefund, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        e.id.toLowerCase().includes(term) ||
        (e.product?.title || '').toLowerCase().includes(term) ||
        (e.paypalOrderId || '').toLowerCase().includes(term) ||
        (e.paypalCaptureId || '').toLowerCase().includes(term) ||
        (e.selectedOffer?.merchantName || '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [entries, searchTerm, statusFilter]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const getStatusBadge = (status: LedgerEntry['status']) => {
    switch (status) {
      case 'CAPTURED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            CAPTURED
          </span>
        );
      case 'SHIELD_BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            SHIELD BLOCKED
          </span>
        );
      case 'POLICY_BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            POLICY BLOCKED
          </span>
        );
      case 'NEEDS_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 animate-pulse">
            <Clock className="w-3 h-3 text-yellow-400" />
            NEEDS APPROVAL
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <RotateCcw className="w-3 h-3 text-purple-400" />
            REFUNDED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-700 text-zinc-300 border border-zinc-600">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
      {/* Table Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Audit Ledger &amp; Settlement Trace</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {filteredEntries.length} Records
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Immutable log of proposals, deterministic verdicts, sandbox settlement IDs &amp; model telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by ID, product, PayPal ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="CAPTURED">Captured Only</option>
            <option value="SHIELD_BLOCKED">Shield Blocked</option>
            <option value="POLICY_BLOCKED">Policy Blocked</option>
            <option value="NEEDS_APPROVAL">Needs Approval</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          {/* Export CSV */}
          <a
            href="/api/ledger/csv"
            download="leash-audit-ledger.csv"
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
            title="Download complete ledger as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export CSV</span>
          </a>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto mt-4 rounded-xl border border-zinc-800">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800">
              <th className="py-3 px-4 font-semibold">Ledger ID</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Product &amp; Merchant</th>
              <th className="py-3 px-4 font-semibold">Amount</th>
              <th className="py-3 px-4 font-semibold">PayPal IDs</th>
              <th className="py-3 px-4 font-semibold">Safety Score</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/40">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans">
                  No audit ledger entries match the current filters.
                </td>
              </tr>
            ) : (
              filteredEntries.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-800/40 transition-colors">
                  {/* ID & Scenario */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-indigo-400">{e.id}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(e.status)}
                    {e.isCachedDemoResult && (
                      <span className="ml-1 text-[9px] uppercase px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        fixture
                      </span>
                    )}
                  </td>

                  {/* Product & Merchant */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-medium text-zinc-200 truncate font-sans">
                      {e.product?.title || 'Custom Mission Request'}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                      <span>{e.selectedOffer?.merchantName || 'External Catalog'}</span>
                      {Boolean(e.selectedOffer?.merchantRating) && (
                        <span>&bull; {e.selectedOffer?.merchantRating}/5.0</span>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-bold text-zinc-100">
                      ${e.totalAmount.toFixed(2)} {e.currency}
                    </div>
                    <div className="text-[10px] text-zinc-500">Qty: {e.quantity}</div>
                  </td>

                  {/* PayPal IDs */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-[11px]">
                    {e.paypalOrderId ? (
                      <div>
                        <div className="flex items-center gap-1 text-zinc-300">
                          <span className="text-zinc-500">Order:</span>
                          <span className="font-bold">{e.paypalOrderId.slice(0, 10)}...</span>
                          <button
                            onClick={() => copyToClipboard(e.paypalOrderId!, e.id)}
                            className="p-0.5 hover:text-white text-zinc-500"
                            title="Copy PayPal Order ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        {e.paypalCaptureId && (
                          <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 mt-0.5">
                            <span className="text-zinc-500">Capture:</span>
                            <span>{e.paypalCaptureId.slice(0, 12)}...</span>
                          </div>
                        )}
                        {copyFeedback === e.id && (
                          <div className="text-[9px] text-emerald-400">Copied!</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-500 italic">None (Pre-payment)</span>
                    )}
                  </td>

                  {/* Safety & Risk */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {e.shieldResult ? (
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            e.shieldResult.isSafe ? 'bg-emerald-400' : 'bg-rose-500'
                          }`}
                        />
                        <span className="text-zinc-300">
                          Risk: {e.shieldResult.riskScore}/100
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-500">0/100</span>
                    )}
                    <div className="text-[10px] text-zinc-500">
                      {e.telemetry.latencyMs}ms &bull; {e.telemetry.modelName}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedEntry(e)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="View Full Cryptographic Audit Detail"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {e.status === 'CAPTURED' && (
                        <button
                          onClick={() => onRefund(e.id)}
                          className="px-2 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-800/80 text-purple-300 hover:text-purple-200 text-[11px] font-sans flex items-center gap-1 cursor-pointer transition-colors"
                          title="Trigger PayPal Refund flow"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Refund</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div>
                <span className="text-xs font-mono uppercase text-indigo-400 font-bold">
                  Audit Record: {selectedEntry.id}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5 font-sans">
                  {selectedEntry.product?.title || selectedEntry.missionPrompt}
                </h4>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block">Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedEntry.status)}</div>
                </div>
                <div>
                  <span className="text-zinc-500 block">Amount:</span>
                  <span className="font-bold text-zinc-200 mt-1 block">
                    ${selectedEntry.totalAmount.toFixed(2)} {selectedEntry.currency}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">PayPal Order ID:</span>
                  <span className="text-zinc-300 select-all">
                    {selectedEntry.paypalOrderId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">PayPal Capture ID:</span>
                  <span className="text-emerald-400 select-all">
                    {selectedEntry.paypalCaptureId || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 font-bold block mb-1">Agent Reasoning:</span>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-zinc-300 leading-relaxed font-sans">
                  {selectedEntry.agentReasoning}
                </div>
              </div>

              <div>
                <span className="text-zinc-400 font-bold block mb-1">Policy Checks:</span>
                <div className="space-y-1.5">
                  {selectedEntry.policyResult?.checks.map((c, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border flex items-center justify-between ${
                        c.severity === 'BLOCK'
                          ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                          : c.severity === 'NEEDS_APPROVAL'
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span>{c.ruleName}</span>
                      <span className="text-[10px] uppercase font-bold">{c.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEntry.shieldResult && !selectedEntry.shieldResult.isSafe && (
                <div>
                  <span className="text-rose-400 font-bold block mb-1">
                    Security Shield Quarantine:
                  </span>
                  <div className="bg-rose-950/30 border border-rose-500/40 p-3 rounded-lg text-rose-200">
                    <div>
                      Attack Vectors Detected:{' '}
                      <strong>{selectedEntry.shieldResult.attackVectorsDetected.join(', ')}</strong>
                    </div>
                    {selectedEntry.shieldResult.quarantinedTextSnippet && (
                      <div className="mt-2 text-xs font-mono bg-black/60 p-2 rounded">
                        Snippet: "{selectedEntry.shieldResult.quarantinedTextSnippet}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] text-zinc-400">
                <span className="font-bold text-zinc-300 block mb-1">Telemetry:</span>
                <div>Model: {selectedEntry.telemetry.modelName}</div>
                <div>Tokens: {selectedEntry.telemetry.totalTokensUsed} (Prompt: {selectedEntry.telemetry.promptTokens}, Completion: {selectedEntry.telemetry.completionTokens})</div>
                <div>Execution Latency: {selectedEntry.telemetry.latencyMs}ms</div>
                <div>Idempotency Key: {selectedEntry.idempotencyKey}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
