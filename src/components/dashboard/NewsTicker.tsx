'use client';

const ITEMS = [
  'OPENSKY · FIRMS · KIWISDR · MARITIME',
  'FRED · BLS · EIA · TREASURY · GSCPI',
  'TELEGRAM · SAFECAST · EPA · WHO · OFAC',
  'GDELT · NOAA · PATENTS · BLUESKY · REDDIT',
  'ACLED · POLYMARKET · COINGECKO · YAHOO',
];

export default function NewsTicker() {
  return (
    <div className="overflow-hidden bg-surface/30 border-b border-border/20 py-1">
      <div className="flex ticker-track animate-scroll">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i} className="text-[10px] text-muted/40 mx-8 font-mono whitespace-nowrap">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}