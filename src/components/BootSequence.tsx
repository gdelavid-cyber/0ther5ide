'use client';

import { useEffect, useState } from 'react';

const LINES = [
  { text: 'INITIALIZING 0ther5ide ENGINE v2.1.0', delay: 0 },
  { text: 'CONNECTING 5 OSINT SOURCES...', delay: 200 },
  { text: '⊡ OPENSKY · FIRMS · KIWISDR · MARITIME', delay: 350 },
  { text: '⊡ FRED · BLS · EIA · TREASURY · GSCPI', delay: 450 },
  { text: '⊡ TELEGRAM · SAFECAST · EPA · WHO · OFAC', delay: 550 },
  { text: '⊡ GDELT · NOAA · PATENTS · BLUESKY · REDDIT', delay: 650 },
  { text: 'SWEEP COMPLETE — 5/5 SOURCES OK', delay: 800 },
  { text: 'ACLED CONFLICT LAYER: ACTIVE', delay: 900 },
  { text: 'FLIGHT CORRIDORS: ACTIVE · DUAL PROJECTION: READY', delay: 1000 },
  { text: 'INTELLIGENCE SYNTHESIS: ACTIVE', delay: 1100 },
];

export default function BootSequence() {
  const [phase, setPhase] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timers = LINES.map((l, i) =>
      setTimeout(() => setPhase(i + 1), l.delay)
    );
    const hideTimer = setTimeout(() => setVisible(false), 2500);
    return () => { timers.forEach(clearTimeout); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div id="boot" className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full border-2 border-accent/30 flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full border border-accent/50 flex items-center justify-center">
              <span className="text-accent text-xl">◎</span>
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border border-accent/20 animate-ping" />
        </div>
        <h1 className="text-2xl font-bold accent-text tracking-wider">0ther5ide</h1>
        <p className="text-[10px] text-muted mt-1 tracking-widest">INTELLIGENCE TERMINAL</p>
      </div>

      <div id="bootLines" className="font-mono text-xs text-muted space-y-1 w-64">
        {LINES.map((l, i) => (
          <div key={i} className={i <= phase ? 'opacity-100' : 'opacity-0'}>
            {l.text}
          </div>
        ))}
      </div>

      <div id="bootFinal" className="mt-6 text-xs text-muted tracking-widest font-mono" style={{ opacity: phase >= LINES.length ? 1 : 0 }}>
        TERMINAL ACTIVE
      </div>

      <div className="mt-8 flex items-center gap-1">
        {['#00ff88', '#ff4444', '#ff8800', '#ffcc00', '#00ff88', '#ff4444'].map((c, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}