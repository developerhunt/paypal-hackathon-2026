import React from 'react';
import { TraceStep } from '../types/ledger.ts';
import {
  Brain,
  Search,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  SlidersHorizontal,
  UserCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface LiveTraceProps {
  steps: TraceStep[];
  currentStep: number;
  isComplete: boolean;
  onOpenApprovalModal?: () => void;
  pendingApproval?: boolean;
}

export const LiveTrace: React.FC<LiveTraceProps> = ({
  steps,
  currentStep,
  isComplete,
  onOpenApprovalModal,
  pendingApproval,
}) => {
  const getStepIcon = (stepNumber: number, status: TraceStep['status']) => {
    if (status === 'RUNNING') {
      return <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />;
    }
    if (status === 'BLOCKED') {
      return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    }
    if (status === 'FAILED') {
      return <XCircle className="w-4 h-4 text-rose-400" />;
    }
    if (status === 'COMPLETED') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }

    switch (stepNumber) {
      case 1:
        return <Brain className="w-4 h-4 text-zinc-500" />;
      case 2:
        return <Search className="w-4 h-4 text-zinc-500" />;
      case 3:
        return <ShieldCheck className="w-4 h-4 text-zinc-500" />;
      case 4:
        return <BarChart3 className="w-4 h-4 text-zinc-500" />;
      case 5:
        return <SlidersHorizontal className="w-4 h-4 text-zinc-500" />;
      case 6:
        return <UserCheck className="w-4 h-4 text-zinc-500" />;
      case 7:
        return <CreditCard className="w-4 h-4 text-zinc-500" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-ping absolute inset-0 opacity-75" />
            <div className="w-3 h-3 rounded-full bg-indigo-600 relative" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-wide uppercase font-mono">
              Live Agent Execution Trace
            </h3>
            <p className="text-xs text-zinc-400">
              Real-time audit chain: Discovery &bull; Shield &bull; Policy &bull; PayPal
            </p>
          </div>
        </div>

        {pendingApproval && (
          <button
            onClick={onOpenApprovalModal}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs flex items-center gap-1.5 animate-bounce shadow-lg shadow-amber-500/30 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>ACTION REQUIRED: Review &amp; Authorize</span>
          </button>
        )}
      </div>

      {/* Step Sequence Timeline */}
      <div className="space-y-4">
        {steps.map((step) => {
          const isBlocked = step.status === 'BLOCKED';
          const isRunning = step.status === 'RUNNING';
          const isCompleted = step.status === 'COMPLETED';

          return (
            <div
              key={step.id}
              className={`relative rounded-xl p-4 border transition-all duration-300 ${
                isBlocked
                  ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/40'
                  : isRunning
                  ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                  : isCompleted
                  ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                  : 'bg-zinc-950/40 border-zinc-800/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      isBlocked
                        ? 'bg-rose-900/40 border-rose-500/40 text-rose-300'
                        : isCompleted
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : isRunning
                        ? 'bg-indigo-900/40 border-indigo-500/40 text-indigo-300'
                        : 'bg-zinc-800/50 border-zinc-700/40 text-zinc-400'
                    }`}
                  >
                    {getStepIcon(step.stepNumber, step.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-300">
                        STEP {step.stepNumber}:
                      </span>
                      <h4
                        className={`text-sm font-semibold ${
                          isBlocked
                            ? 'text-rose-300 font-bold'
                            : isRunning
                            ? 'text-indigo-300'
                            : isCompleted
                            ? 'text-white'
                            : 'text-zinc-400'
                        }`}
                      >
                        {step.title}
                      </h4>
                    </div>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isBlocked
                          ? 'text-rose-200/90 font-medium'
                          : 'text-zinc-400'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isBlocked
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : isRunning
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 animate-pulse'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {step.status}
                  </span>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Special details rendering for blocked attacks */}
              {isBlocked && Boolean(step.details?.quarantinedSnippet) && (
                <div className="mt-3 p-2.5 rounded-lg bg-black/60 border border-rose-500/30 font-mono text-[11px] text-rose-300">
                  <div className="text-[10px] uppercase text-rose-400 font-bold mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Quarantined Payload Snippet:
                  </div>
                  <span className="italic">"{String(step.details?.quarantinedSnippet || '')}"</span>
                </div>
              )}

              {/* Details rendering for PayPal settlement */}
              {isCompleted && step.stepNumber === 7 && step.details && (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono">
                  {Boolean(step.details.orderId) && (
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      PayPal Order: {String(step.details.orderId)}
                    </span>
                  )}
                  {Boolean(step.details.captureId) && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Capture ID: {String(step.details.captureId)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
