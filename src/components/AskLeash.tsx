import React, { useState } from 'react';
import { MessageSquareQuote, Send, Sparkles, Bot, User, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'leash';
  text: string;
  timestamp: string;
  stats?: unknown;
}

export const AskLeash: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-01',
      sender: 'leash',
      text: 'Hello! I am **Ask Leash**, your audited spend-intelligence copilot. Ask me anything about what your shopping agent proposed, approved, or settled with PayPal, or about any security attacks intercepted by the policy engine.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'What did my agent spend this week and why?',
    'Were there any security attacks blocked?',
    'Which merchants and stores were approved?',
    'What is my remaining budget on the active mandate?',
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask-leash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          sender: 'leash',
          text: data.answer,
          timestamp: new Date().toLocaleTimeString(),
          stats: data.stats,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Failed to query spend intelligence');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'leash',
          text: 'Encountered an issue querying the audit ledger. Please ensure the server is running.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 mb-1">
          <MessageSquareQuote className="w-4 h-4" />
          Natural-Language Spend Intelligence &amp; Audit Inspector
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Ask Leash
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Cryptographically audited conversational insights powered by Google Gemini and verified PayPal settlement records.
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer text-left flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col h-[480px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none font-sans'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-2 text-right">
                    {m.timestamp}
                  </div>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                    <User className="w-4 h-4 text-zinc-300" />
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-400 italic font-mono flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>Auditing ledger records &amp; synthesizing insights...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 pt-3 border-t border-zinc-800 flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask about spending, orders, blocked attacks, merchants..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-sans"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors shadow-lg shadow-indigo-600/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
