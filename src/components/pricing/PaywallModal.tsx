"use client";

interface Props {
  featureName: string;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function PaywallModal({ featureName, onClose, onUpgrade }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-[#06080d] border border-yellow-500/60 rounded-2xl shadow-[0_0_50px_rgba(255,215,0,0.25)] overflow-hidden text-xs">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface/90 border-b border-border/40">
          <div className="flex items-center gap-2 text-yellow-400 font-bold tracking-wider">
            <span>🔒</span>
            <span>RESTRICTED FEATURE</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded bg-bg/80 border border-border/60 hover:border-red-400 hover:text-red-400 flex items-center justify-center text-muted transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center text-2xl mx-auto">
            👑
          </div>

          <div>
            <h3 className="text-base font-bold text-fg">
              {featureName} Requires Elite Insider
            </h3>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">
              You are currently on the Free Recon Tier. Upgrade to Elite Insider to unlock institutional AI chart targets, GEX dark pools, and unredacted dossiers.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-surface/70 border border-border/50 text-left space-y-1.5 text-[11px]">
            <div className="font-bold text-accent text-[10px] uppercase">ELITE PRIVILEGES:</div>
            <div className="text-fg">✓ 1-Click AI Entry/SL/TP Trade Targets</div>
            <div className="text-fg">✓ Unredacted SEC C-Suite Surveillance</div>
            <div className="text-fg">✓ Real-Time Institutional Dark Pool GEX</div>
            <div className="text-fg">✓ 4-Node Autonomous Swarm Engine</div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={onUpgrade}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-bg font-extrabold text-xs tracking-widest uppercase shadow-lg shadow-yellow-500/20 hover:brightness-110 active:scale-95 transition"
            >
              👑 UNLOCK ALL FOR $25 / WEEK
            </button>
            <div className="text-[9px] text-muted">Cancel anytime · Instant activation</div>
          </div>
        </div>
      </div>
    </div>
  );
}
