'use client';

import { useState, useRef } from 'react';

export default function ChartAnalysis() {
  const [result, setResult] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    // Simulate analysis
    await new Promise(r => setTimeout(r, 1500));
    setResult(`ANALYSIS: ${file.name}
━━━━━━━━━━━━━━━━━━
VERDICT: BULLISH
ENTRY: $0.00
STOP: $0.00
TARGET: $0.00
RISK: LOW
━━━━━━━━━━━━━━━━━━
Pattern detected: uptrend continuation
Volume confirmation: 2.3x average
RSI: 58.2 (neutral-bullish)
MACD: bullish crossover`);
    setUploading(false);
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-accent font-bold text-sm">AGENT</span>
        <span className="text-[10px] text-muted">Chart Analysis</span>
      </div>

      <div
        id="dropZone"
        className="flex-1 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-2 mb-3 hover:border-accent/30 transition cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <div className="text-muted text-xs animate-pulse">Analyzing chart...</div>
        ) : (
          <>
            <div className="text-3xl text-muted/50">⇪</div>
            <div className="text-xs text-muted">Drop a chart here</div>
            <div className="text-[10px] text-muted/50">PNG · JPG · WebP · paste (⌘V)</div>
          </>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      {result && (
        <div id="analysisDock" className="bg-surface/80 border border-border/50 rounded-lg p-3 text-[11px] font-mono whitespace-pre-line text-fg overflow-y-auto max-h-48">
          {result}
        </div>
      )}
    </div>
  );
}