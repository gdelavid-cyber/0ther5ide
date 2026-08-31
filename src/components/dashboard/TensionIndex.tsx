'use client';

import { cn } from '@/lib/utils';
import type { TensionIndex as TensionType } from '@/lib/types';

interface Props {
  data: TensionType | null;
}

const COLORS = {
  SEVERE: { bg: 'bg-red-500', text: 'text-red-400', glow: 'shadow-red-500/30' },
  HIGH: { bg: 'bg-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/30' },
  ELEVATED: { bg: 'bg-yellow-500', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' },
  LOW: { bg: 'bg-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' },
};

export default function TensionIndex({ data }: Props) {
  if (!data) {
    return (
      <div className="glass-panel p-4">
        <div className="text-muted text-xs uppercase tracking-wider mb-1">Global Tension</div>
        <div className="text-3xl font-bold text-muted">--</div>
      </div>
    );
  }

  const c = COLORS[data.level] || COLORS.LOW;

  return (
    <div className="glass-panel p-4 glow-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted text-xs uppercase tracking-wider">Global Tension</span>
        <div id="tensionPill" className={`flex items-center gap-2 px-2 py-0.5 rounded-full border ${c.glow}`}>
          <span className={`w-2 h-2 rounded-full ${c.bg} signal-pulse`} />
          <span id="tpLevel" className={`text-xs font-bold ${c.text}`}>{data.level}</span>
        </div>
      </div>
      <div id="tpScore" className="text-5xl font-bold accent-text">{data.score}</div>
      <div className="mt-2 space-y-1">
        {data.regions.slice(0, 5).map((r, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-fg/80">{r.country}</span>
            <span className={cn('font-bold', r.score > 50 ? 'text-warn' : r.score > 25 ? 'text-high' : 'text-elevated')}>
              {r.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}