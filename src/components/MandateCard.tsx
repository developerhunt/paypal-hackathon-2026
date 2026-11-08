import React, { useState } from 'react';
import { MandateRule } from '../types/mandate.ts';
import { Wifi, Cpu, ShieldCheck, Edit3, X, Check, DollarSign, Calendar, Lock } from 'lucide-react';

interface MandateCardProps {
  mandate: MandateRule;
  onUpdateMandate: (updated: MandateRule) => void;
}

export const MandateCard: React.FC<MandateCardProps> = ({ mandate, onUpdateMandate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<MandateRule>({ ...mandate });

  // Calculate budget usage percentage
  const budgetSpent = Math.max(0, mandate.maxBudgetTotal - mandate.remainingBudget);
  const spentPercent = Math.min(100, Math.round((budgetSpent / mandate.maxBudgetTotal) * 100));
  const remainingPercent = 100 - spentPercent;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMandate({ ...formData });
    setIsEditing(false);
  };

  return (
    <div className="relative">
      {/* Visual Smart Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-indigo-950/70 to-zinc-950 p-6 border border-indigo-500/30 shadow-2xl shadow-indigo-950/50 text-white">
        {/* Decorative holographic sheen pattern */}
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-8 rounded bg-gradient-to-tr from-amber-300 via-amber-200 to-amber-400 p-1 flex items-center justify-center shadow-inner">
              <Cpu className="w-6 h-6 text-amber-950" />
            </div>
            <Wifi className="w-5 h-5 text-zinc-400 rotate-90" />
            <span className="text-xs font-mono font-semibold tracking-widest text-indigo-300 uppercase">
              LEASH AGENT MANDATE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              POLICY ENFORCED
            </span>
            <button
              onClick={() => {
                setFormData({ ...mandate });
                setIsEditing(true);
              }}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Edit Mandate Parameters"
              aria-label="Edit Mandate Parameters"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Remaining Budget Display */}
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs uppercase font-mono tracking-wider text-zinc-400">
              Remaining Budget
            </span>
            <span className="text-xs font-mono text-zinc-300">
              Limit: ${mandate.maxBudgetTotal.toFixed(2)} {mandate.currency}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              ${mandate.remainingBudget.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-zinc-400 font-mono">
              {mandate.currency}
            </span>
          </div>

          {/* Budget Meter Bar */}
          <div className="w-full bg-zinc-800/80 rounded-full h-2.5 mt-2 overflow-hidden border border-zinc-700/50">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                remainingPercent > 50
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : remainingPercent > 20
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                  : 'bg-gradient-to-r from-rose-500 to-red-400'
              }`}
              style={{ width: `${Math.max(5, remainingPercent)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-400 mt-1">
            <span>Spent: ${budgetSpent.toFixed(2)} ({spentPercent}%)</span>
            <span>Available: {remainingPercent}%</span>
          </div>
        </div>

        {/* Mandate Constraints Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-zinc-800/80 text-xs font-mono">
          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
            <div className="text-[10px] text-zinc-400 uppercase">Auto-Approve Cap</div>
            <div className="font-bold text-emerald-400 mt-0.5">
              &le; ${mandate.autoApproveThreshold.toFixed(2)}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
            <div className="text-[10px] text-zinc-400 uppercase">Per-Item Ceiling</div>
            <div className="font-bold text-indigo-300 mt-0.5">
              &le; ${mandate.maxPerItemPrice.toFixed(2)}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
            <div className="text-[10px] text-zinc-400 uppercase">Min Seller Rating</div>
            <div className="font-bold text-amber-300 mt-0.5">
              &ge; {mandate.minMerchantRating.toFixed(1)} / 5.0
            </div>
          </div>

          <div className="bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
            <div className="text-[10px] text-zinc-400 uppercase">Max Quantity</div>
            <div className="font-bold text-zinc-200 mt-0.5">
              {mandate.maxQuantityPerItem} unit(s)
            </div>
          </div>
        </div>

        {/* Card Footer: Categories & Expiry */}
        <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-zinc-400">Categories:</span>
            {mandate.allowedCategories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700"
              >
                {cat}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-400">
            <Calendar className="w-3 h-3 text-zinc-400" />
            <span>Exp: {new Date(mandate.expiresAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Edit Mandate Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">Edit Mandate Policy Bounds</h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Total Budget ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.maxBudgetTotal}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        maxBudgetTotal: val,
                        remainingBudget: val,
                      });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Auto-Approve Threshold ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.autoApproveThreshold}
                    onChange={(e) =>
                      setFormData({ ...formData, autoApproveThreshold: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Per-Item Price Cap ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.maxPerItemPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, maxPerItemPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Min Merchant Rating (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.minMerchantRating}
                    onChange={(e) =>
                      setFormData({ ...formData, minMerchantRating: parseFloat(e.target.value) || 4.0 })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Allowed Categories (comma separated)</label>
                <input
                  type="text"
                  value={formData.allowedCategories.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowedCategories: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Blacklisted Merchants (comma separated)</label>
                <input
                  type="text"
                  value={formData.deniedMerchants.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deniedMerchants: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-sans cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  <Check className="w-4 h-4" />
                  Apply Mandate Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
