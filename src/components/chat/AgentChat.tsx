'use client';

import { useState, useRef, useEffect } from 'react';

export default function AgentChat() {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setBusy(true);

    const nextMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextMessages);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          analysis: null,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.reply || 'Agent offline.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: 'Signal lost — agent unreachable.' }]);
    }

    setBusy(false);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm">AGENT</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent signal-pulse" />
        </div>
        <span className="text-[10px] text-muted">GPT-4o · classified</span>
      </div>

      <div id="agentChatLog" ref={logRef} className="flex-1 overflow-y-auto space-y-2 min-h-0 mb-3">
        {messages.length === 0 && (
          <div className="text-muted text-xs text-center py-8">
            Upload a chart or type an analysis query.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                m.role === 'user'
                  ? 'bg-accent/20 text-accent border border-accent/20'
                  : 'bg-surface text-fg border border-border/50'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2">
            <div className="max-w-[80%] rounded-lg px-3 py-2 text-xs bg-surface border border-border/50">
              <span className="animate-pulse">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          id="agentChatInput"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Analyze NVDA, query geopolitical risk..."
          className="flex-1 bg-surface border border-border/50 rounded-lg px-3 py-2 text-xs text-fg placeholder-muted/50 focus:outline-none focus:border-accent/50"
        />
        <button
          id="agentChatSend"
          onClick={sendMessage}
          disabled={busy || !input.trim()}
          className="px-4 py-2 bg-accent/20 border border-accent/30 rounded-lg text-accent text-xs font-bold hover:bg-accent/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? '...' : 'SEND'}
        </button>
      </div>
    </div>
  );
}