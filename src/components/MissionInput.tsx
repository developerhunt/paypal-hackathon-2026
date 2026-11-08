import React, { useState } from 'react';
import { MandateRule } from '../types/mandate.ts';
import { Send, Sparkles, Terminal, Play, Sliders } from 'lucide-react';

interface MissionInputProps {
  onRunMission: (prompt: string) => Promise<void>;
  onCompileMandate: (prompt: string) => Promise<void>;
  isRunning: boolean;
  activeMandate: MandateRule;
}

export const MissionInput: React.FC<MissionInputProps> = ({
  onRunMission,
  onCompileMandate,
  isRunning,
  activeMandate,
}) => {
  const [prompt, setPrompt] = useState(
    'Find noise-cancelling headphones under $150 from reputable sellers. Buy automatically if under $100, ask me otherwise.'
  );

  const presets = [
    {
      label: 'Headphones Under $150 (Auto-buy < $100)',
      text: 'Find noise-cancelling headphones under $150 from reputable sellers. Buy automatically if under $100, ask me otherwise.',
    },
    {
      label: 'Mechanical Keyboard (Needs Approval)',
      text: 'Find a high-quality mechanical keyboard under $150. Auto-approve under $100, ask me otherwise.',
    },
    {
      label: 'Clearance Audio (Adversarial Test)',
      text: 'Scan clearance headphone inventory for the lowest price audio deals.',
    },
    {
      label: 'Executive Chronograph (Budget Overrun)',
      text: 'Look for luxury executive chronograph watches and timepieces.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isRunning) return;
    onRunMission(prompt);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
            Shopping Mission Prompt
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          Natural Language &rarr; Structured Bounds &rarr; Autonomous Flow
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isRunning}
            placeholder="Type your shopping mission in plain English (e.g. Find wireless headphones under $150 with ANC, buy if under $100)..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
          />
        </div>

        {/* Preset Mission Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-zinc-400 uppercase mr-1">
            Presets:
          </span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPrompt(preset.text);
                onCompileMandate(preset.text);
              }}
              className="text-[11px] font-sans px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => onCompileMandate(prompt)}
            disabled={isRunning || !prompt.trim()}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-700 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Compile Prompt to Mandate</span>
          </button>

          <button
            type="submit"
            disabled={isRunning || !prompt.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isRunning ? 'Mission Running...' : 'Execute Mission Loop'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
