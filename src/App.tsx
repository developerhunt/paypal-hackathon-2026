import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Navbar, ActiveTab } from './components/Navbar.tsx';
import { MandateCard } from './components/MandateCard.tsx';
import { MissionInput } from './components/MissionInput.tsx';
import { LiveTrace } from './components/LiveTrace.tsx';
import { ApprovalModal } from './components/ApprovalModal.tsx';
import { LedgerGrid } from './components/LedgerGrid.tsx';
import { DemoScenarios, DemoScenarioItem } from './components/DemoScenarios.tsx';
import { JudgeTour } from './components/JudgeTour.tsx';
import { TrustReport } from './components/TrustReport.tsx';
import { AskLeash } from './components/AskLeash.tsx';
import { MandateRule } from './types/mandate.ts';
import { LedgerEntry, TraceStep, MissionRunProgress } from './types/ledger.ts';
import {
  ShieldCheck,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Github,
  Award,
  Terminal,
  ExternalLink,
} from 'lucide-react';

const DEFAULT_MANDATE: MandateRule = {
  id: 'mnd-init-01',
  name: 'Electronics & Audio Mandate',
  maxBudgetTotal: 150.0,
  remainingBudget: 150.0,
  maxPerItemPrice: 150.0,
  autoApproveThreshold: 100.0,
  allowedCategories: ['Electronics', 'Audio', 'Headphones', 'Office', 'Keyboards'],
  deniedCategories: ['Luxury', 'Weapons', 'Gambling'],
  allowedMerchants: [],
  deniedMerchants: ['ShadyElectronicsDirect'],
  minMerchantRating: 4.0,
  currency: 'USD',
  maxQuantityPerItem: 2,
  maxPurchasesPerHour: 5,
  expiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
  allowPriceDriftPercent: 5,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mission');
  const [darkMode, setDarkMode] = useState(true);
  const [mandate, setMandate] = useState<MandateRule>(DEFAULT_MANDATE);
  const [isRunning, setIsRunning] = useState(false);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [stats, setStats] = useState<{
    totalSpent: number;
    blockedCount: number;
    capturedCount: number;
  }>({
    totalSpent: 89.99,
    blockedCount: 2,
    capturedCount: 1,
  });

  const [pendingApprovalEntry, setPendingApprovalEntry] = useState<LedgerEntry | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Sync ledger records and stats from backend
  const loadLedger = useCallback(async () => {
    try {
      const res = await fetch('/api/ledger');
      if (res.ok) {
        const data = await res.json();
        setLedgerEntries(data.entries || []);
        if (data.stats) {
          setStats({
            totalSpent: data.stats.totalSpent || 0,
            blockedCount: data.stats.blockedCount || 0,
            capturedCount: data.stats.capturedCount || 0,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch ledger:', err);
    }
  }, []);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  // Compile prompt to structured mandate
  const handleCompileMandate = async (promptText: string) => {
    try {
      const res = await fetch('/api/mandate/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mandate) {
          setMandate(data.mandate);
        }
      }
    } catch (err) {
      console.error('Compile error:', err);
    }
  };

  // Run shopping mission
  const handleRunMission = async (
    promptText: string,
    scenarioKey: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'CUSTOM' = 'CUSTOM'
  ) => {
    setIsRunning(true);
    setTraceSteps([]);
    setCurrentStep(1);

    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          mandate,
          scenarioKey,
          stream: false,
        }),
      });

      if (res.ok) {
        const data: MissionRunProgress = await res.json();
        setTraceSteps(data.steps);
        setCurrentStep(data.currentStep);

        if (data.ledgerEntry) {
          if (data.ledgerEntry.status === 'NEEDS_APPROVAL') {
            setPendingApprovalEntry(data.ledgerEntry);
            setShowApprovalModal(true);
          } else if (data.ledgerEntry.status === 'CAPTURED') {
            confetti({
              particleCount: 60,
              spread: 60,
              ticks: 50,
              origin: { y: 0.6 },
            });
            // Update mandate remaining budget
            setMandate((prev) => ({
              ...prev,
              remainingBudget: Math.max(0, prev.remainingBudget - data.ledgerEntry!.totalAmount),
            }));
          }
        }
        await loadLedger();
      }
    } catch (err) {
      console.error('Run mission error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Approve a pending order above auto-approval ceiling
  const handleApproveOrder = async (ledgerId: string) => {
    try {
      const res = await fetch('/api/agent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerId }),
      });
      if (res.ok) {
        confetti({
          particleCount: 60,
          spread: 70,
          ticks: 50,
          origin: { y: 0.6 },
        });
        setPendingApprovalEntry(null);
        await loadLedger();
        // Update trace if active
        setTraceSteps((prev) =>
          prev.map((s) =>
            s.stepNumber === 6
              ? { ...s, status: 'COMPLETED', description: 'Authorized by human buyer via PayPal' }
              : s.stepNumber === 7
              ? { ...s, status: 'COMPLETED', description: 'PayPal sandbox order captured successfully' }
              : s
          )
        );
      }
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  // Reject a pending order
  const handleRejectOrder = async (ledgerId: string, reason: string) => {
    try {
      const res = await fetch('/api/agent/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerId, reason }),
      });
      if (res.ok) {
        setPendingApprovalEntry(null);
        await loadLedger();
      }
    } catch (err) {
      console.error('Reject error:', err);
    }
  };

  // Process a refund
  const handleRefundOrder = async (ledgerId: string) => {
    try {
      const res = await fetch('/api/ledger/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ledgerId, reason: 'PayPal Sandbox Dispute & Return' }),
      });
      if (res.ok) {
        await loadLedger();
      }
    } catch (err) {
      console.error('Refund error:', err);
    }
  };

  // Run a scenario from the demo deck
  const handleRunScenario = async (scenario: DemoScenarioItem) => {
    if (scenario.key === 'E') {
      // Find captured order or run refund
      const captured = ledgerEntries.find((e) => e.status === 'CAPTURED');
      if (captured) {
        await handleRefundOrder(captured.id);
        setActiveTab('ledger');
      } else {
        // Run scenario A first then refund
        setActiveTab('mission');
        await handleRunMission(scenario.prompt, 'E');
      }
      return;
    }

    if (scenario.key === 'F') {
      setActiveTab('ask');
      return;
    }

    setActiveTab('mission');
    await handleCompileMandate(scenario.prompt);
    await handleRunMission(scenario.prompt, scenario.key);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors`}>
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content Viewports */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Mission Control */}
        {activeTab === 'mission' && (
          <div className="space-y-8">
            {/* Top Grid: Mandate Card & Mission Input */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5">
                <MandateCard
                  mandate={mandate}
                  onUpdateMandate={(updated) => setMandate(updated)}
                />
              </div>

              <div className="lg:col-span-7">
                <MissionInput
                  onRunMission={(p) => handleRunMission(p, 'CUSTOM')}
                  onCompileMandate={handleCompileMandate}
                  isRunning={isRunning}
                  activeMandate={mandate}
                />
              </div>
            </div>

            {/* Live Agent Trace Timeline */}
            <div>
              <LiveTrace
                steps={traceSteps}
                currentStep={currentStep}
                isComplete={!isRunning}
                pendingApproval={Boolean(pendingApprovalEntry)}
                onOpenApprovalModal={() => setShowApprovalModal(true)}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Demo Scenarios A-F */}
        {activeTab === 'scenarios' && (
          <DemoScenarios onRunScenario={handleRunScenario} isRunning={isRunning} />
        )}

        {/* Tab 3: AG Grid Audit Ledger */}
        {activeTab === 'ledger' && (
          <LedgerGrid
            entries={ledgerEntries}
            onRefund={handleRefundOrder}
            onRefresh={loadLedger}
          />
        )}

        {/* Tab 4: Trust & Evals */}
        {activeTab === 'evals' && <TrustReport />}

        {/* Tab 5: Judge Tour */}
        {activeTab === 'judge' && <JudgeTour />}

        {/* Tab 6: Ask Leash */}
        {activeTab === 'ask' && <AskLeash />}
      </main>

      {/* Human Approval Modal */}
      {showApprovalModal && pendingApprovalEntry && (
        <ApprovalModal
          entry={pendingApprovalEntry}
          onApprove={handleApproveOrder}
          onReject={handleRejectOrder}
          onClose={() => setShowApprovalModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-zinc-800/80 bg-zinc-950 py-8 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white font-mono">LEASH</span>
            <span className="text-zinc-400">
              &mdash; Agentic Commerce Trust &amp; Policy Layer for PayPal
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px]">
            <span>MIT License</span>
            <span>&bull;</span>
            <a
              href="https://github.com/developerhunt/paypal-hackathon-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repo</span>
            </a>
            <span>&bull;</span>
            <span>PayPal Sandbox v2</span>
            <span>&bull;</span>
            <span>Google Gemini 2.5 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
