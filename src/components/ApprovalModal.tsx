import React, { useState } from 'react';
import { LedgerEntry } from '../types/ledger.ts';
import { UserCheck, ShieldCheck, AlertCircle, X, Check, Lock, Star, Building2 } from 'lucide-react';

interface ApprovalModalProps {
  entry: LedgerEntry;
  onApprove: (ledgerId: string) => Promise<void>;
  onReject: (ledgerId: string, reason: string) => Promise<void>;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  entry,
  onApprove,
  onReject,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(entry.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(entry.id, rejectReason || 'Declined by user');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const product = entry.product;
  const offer = entry.selectedOffer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 max-w-xl w-full shadow-2xl shadow-amber-950/40 text-white relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-300">
                Human Authorization Gate Triggered
              </h3>
              <p className="text-xs text-zinc-400">
                Transaction total exceeds auto-approval threshold &bull; Ledger ID: {entry.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product & Proposed Order Card */}
        <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 mb-4">
          <div className="flex gap-4">
            {product?.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-20 h-20 object-cover rounded-lg border border-zinc-800 shrink-0"
              />
            )}
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-zinc-100 leading-snug">
                {product?.title || 'Proposed Product'}
              </h4>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                  {offer?.merchantName || 'Authorized Merchant'}
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {offer?.merchantRating || 4.8} / 5.0
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-xs font-mono text-zinc-400">
                  Quantity: {entry.quantity} unit(s)
                </span>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    ${entry.totalAmount.toFixed(2)}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono ml-1">
                    {entry.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Threshold Explanation */}
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 mb-4 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Why was this paused?</strong> The proposed purchase amount of{' '}
            <span className="font-mono font-bold">${entry.totalAmount.toFixed(2)}</span> exceeds
            your mandate auto-approval limit of{' '}
            <span className="font-mono font-bold">
              ${entry.mandateSnapshot.autoApproveThreshold.toFixed(2)}
            </span>
            . However, it is within your total budget limit ($
            {entry.mandateSnapshot.maxBudgetTotal.toFixed(2)}).
          </div>
        </div>

        {/* Agent Justification */}
        <div className="space-y-2 text-xs mb-5">
          <div className="bg-zinc-950/70 p-3 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 block mb-1">
              Agent Justification:
            </span>
            <p className="text-zinc-300 leading-relaxed">{entry.agentReasoning}</p>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-lg border border-zinc-800/80">
            <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block mb-1">
              Risk Assessment:
            </span>
            <p className="text-zinc-400 leading-relaxed">{entry.riskAnalysis}</p>
          </div>
        </div>

        {/* Rejection input when toggled */}
        {showRejectInput && (
          <div className="mb-4">
            <label className="block text-xs text-zinc-400 mb-1">Reason for Rejection:</label>
            <input
              type="text"
              placeholder="e.g. Price too high, found alternative..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
          {!showRejectInput ? (
            <button
              onClick={() => setShowRejectInput(true)}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Reject...
            </button>
          ) : (
            <button
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              Confirm Rejection
            </button>
          )}

          {entry.paypalApprovalUrl && (
            <a
              href={entry.paypalApprovalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/40 cursor-pointer transition-colors"
              title="Open official PayPal Sandbox checkout flow in new tab"
            >
              <span>Open PayPal Checkout</span>
            </a>
          )}

          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authorizing via PayPal...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Authorize &amp; Settle via PayPal Sandbox</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
