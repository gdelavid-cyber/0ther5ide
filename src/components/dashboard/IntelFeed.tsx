'use client';

import { useState, useEffect, useCallback } from 'react';
import { timeAgo, severityColor, severityLabel } from '@/lib/utils';
import type { Signal } from '@/lib/types';

interface Props {
  initialSignals?: Signal[];
}

export default function IntelFeed({ initialSignals = [] }: Props) {
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [loading, setLoading] = useState(!initialSignals.length);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/intel');
      if (!res.ok) return;
      const data = await res.json();
      setSignals(data.signals || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!initialSignals.length) fetchData();
  }, [initialSignals, fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, 150000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm">INTEL FEED</span>
          <span className="text-xs text-muted">LIVE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent signal-pulse" />
        </div>
        <span id="intelStatusTxt" className="text-xs text-muted">
          {signals.length} signals
        </span>
      </div>

      <div id="intelGrid" className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-border/20 rounded animate-pulse" />
          ))
        ) : signals.length === 0 ? (
          <div className="text-muted text-xs text-center py-8">Awaiting live intel...</div>
        ) : (
          signals.slice(0, 50).map((s, i) => (
            <div
              key={s.id || i}
              className="flex items-start gap-3 p-2 rounded bg-surface/50 hover:bg-surface/80 transition-colors cursor-pointer border border-transparent hover:border-border/50"
            >
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: severityColor(s.severity) }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-fg leading-tight line-clamp-2">{s.title}</div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted">
                  <span>{s.country}</span>
                  <span>·</span>
                  <span>{severityLabel(s.severity)}</span>
                  <span>·</span>
                  <span>{s.source}</span>
                  <span>·</span>
                  <span>{timeAgo(s.ts)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div id="intelMeta" className="text-[10px] text-muted mt-2 pt-2 border-t border-border/30">
        {signals.length} filings · ACLED · GDELT · FIRMS
      </div>
    </div>
  );
}