"use client";

interface Props {
  featureName: string;
  description?: string;
  onUpgrade: () => void;
}

export default function LockedFeatureView({
  featureName,
  description = "This institutional module requires an active 0ther5ide Elite Insider clearance.",
  onUpgrade,
}: Props) {
  return (
    <div className="w-full h-full min-h-[480px] rounded-2xl bg-[#04060a]/90 border border-yellow-500/30 p-6 flex flex-col items-center justify-center text-center font-mono shadow-2xl relative overflow-hidden">
      {/* Background Matrix Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffd70008_1px,transparent_1px),linear-gradient(to_bottom,#ffd70008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Lock Icon Banner */}
      <div className="relative z-10 space-y-4 max-w-lg">
        <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center text-3xl mx-auto shadow-[0_0_30px_rgba(255,215,0,0.2)]">
          🔒
        </div>

        <div>
          <div className="text-[10px] text-yellow-400 font-extrabold tracking-widest uppercase">
            RESTRICTED CLEARANCE · LEVEL 4 VIP ONLY
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-fg mt-1">
            {featureName} IS LOCKED
          </h2>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* What You Unlock */}
        <div className="p-4 rounded-xl bg-surface/70 border border-border/60 text-left space-y-2 text-xs">
          <div className="text-[10px] font-bold text-accent tracking-wider uppercase">
            ⚡ INCLUDED WITH ELITE INSIDER ($25/WK):
          </div>
          <div className="flex items-center gap-2 text-fg">
            <span className="text-accent">✓</span>
            <span>Unredacted SEC Form 4 Executive Surveillance Dossiers</span>
          </div>
          <div className="flex items-center gap-2 text-fg">
            <span className="text-accent">✓</span>
            <span>Real-time Dark Pool ADF Prints & GEX Gamma Wall Ladder</span>
          </div>
          <div className="flex items-center gap-2 text-fg">
            <span className="text-accent">✓</span>
            <span>4-Node Autonomous AI Swarm Continuous Scraping Pipeline</span>
          </div>
          <div className="flex items-center gap-2 text-fg">
            <span className="text-accent">✓</span>
            <span>Exact 1-Click AI Trade Entry, Stop-Loss & Take-Profit Targets</span>
          </div>
        </div>

        {/* Upgrade Action CTA */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onUpgrade}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-bg font-extrabold text-xs tracking-widest uppercase shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:brightness-110 active:scale-95 transition"
          >
            👑 UNLOCK ELITE INSIDER PASS ($25/WEEK)
          </button>
          <div className="text-[9px] text-muted">
            Instant automatic activation · Cancel anytime with 1 click
          </div>
        </div>
      </div>
    </div>
  );
}
