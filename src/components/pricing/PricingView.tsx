"use client";

import { useState } from "react";

interface Props {
  currentTier: "recon" | "vip";
  onSelectTier: (tier: "recon" | "vip") => void;
  onOpenAuth?: () => void;
}

export default function PricingView({ currentTier, onSelectTier, onOpenAuth }: Props) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const handleUpgrade = async (tier: "recon" | "vip") => {
    if (tier === "recon") {
      try { localStorage.setItem("0ther5ide_user_tier", "recon"); } catch {}
      onSelectTier("recon");
      setToastMessage("RECON FREE PLAN ACTIVE");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "vip" }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      try { localStorage.setItem("0ther5ide_user_tier", "vip"); } catch {}
      onSelectTier("vip");
      setToastMessage("👑 ELITE INSIDER ACCESS ACTIVATED // ALL MODULES UNLOCKED");
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      try { localStorage.setItem("0ther5ide_user_tier", "vip"); } catch {}
      onSelectTier("vip");
      setToastMessage("👑 ELITE INSIDER ACCESS ACTIVATED");
      setTimeout(() => setToastMessage(null), 4000);
    }
    setLoadingCheckout(false);
  };

  return (
    <div className="glass-panel p-6 sm:p-8 flex flex-col h-full glow-border overflow-y-auto space-y-8 max-w-5xl mx-auto w-full relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#0e1612] border border-green-400 text-green-300 font-mono text-xs font-bold shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 signal-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-xs font-bold font-mono tracking-widest text-accent uppercase">
          PLANS &amp; ACCESS
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider font-mono">
          TERMINAL PRICING
        </h1>
        <p className="text-xs sm:text-sm text-muted max-w-xl mx-auto font-sans leading-relaxed">
          Real-time geopolitical intelligence, elite SEC Form 4 surveillance dossiers, institutional order flow, and unlimited AI agent execution.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
        {/* Recon Free Tier */}
        <div className="p-6 rounded-2xl bg-surface/40 border border-border/60 flex flex-col justify-between space-y-6 hover:border-border transition">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-mono">RECON</h3>
              <span className="px-2 py-0.5 rounded bg-surface text-muted text-[10px] font-mono border border-border/50">
                FREE FOREVER
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white font-mono">$0</span>
              <span className="text-xs text-muted font-mono">/ month</span>
            </div>
            <p className="text-xs text-muted font-sans">
              Standard stock/crypto candlestick chart with live prices, plus full interactive AI Co-Pilot chat access.
            </p>

            <ul className="space-y-2.5 text-xs text-fg/90 pt-2 font-mono">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Live 3D Earth &amp; Geopolitical Streams
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Signal Core &amp; Macro Economic Ticker
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Full Interactive Tactical AI Co-Pilot
              </li>
              <li className="flex items-center gap-2 text-muted/60">
                <span>—</span> Exact Entry, Stop-Loss &amp; Take-Profit Levels
              </li>
              <li className="flex items-center gap-2 text-muted/60">
                <span>—</span> Full Classified SEC Form 4 Surveillance Dossiers
              </li>
              <li className="flex items-center gap-2 text-muted/60">
                <span>—</span> Institutional Order Flow &amp; Dark Pools
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade("recon")}
            className={"w-full py-3 rounded-xl border text-xs font-bold font-mono tracking-wider transition " + (
              currentTier === "recon"
                ? "bg-surface text-muted border-border/60 cursor-default"
                : "bg-surface hover:bg-border/40 text-fg border-border/80"
            )}
          >
            {currentTier === "recon" ? "CURRENT ACTIVE PLAN" : "START FREE"}
          </button>
        </div>

        {/* VIP Insider Tier */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-yellow-500/10 via-surface/40 to-surface/65 border-2 border-yellow-500/50 flex flex-col justify-between space-y-6 shadow-xl shadow-yellow-500/5 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold text-[10px] font-mono tracking-widest uppercase">
              ELITE PASS
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-yellow-300 font-mono">ELITE INSIDER</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white font-mono">$25</span>
              <span className="text-xs text-muted font-mono">/ week</span>
            </div>
            <p className="text-xs text-yellow-200/80 font-sans">
              The complete institutional edge — unlocked price targets, unlimited dossiers, and AI agent on call.
            </p>

            <ul className="space-y-2.5 text-xs text-fg pt-2 font-mono">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Everything in Recon Plan
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> UNLIMITED Chart Analyses with Entry, SL &amp; TP
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> SEC Form 4 Surveillance Dossiers &amp; Decryptions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Institutional Order Flow, Sweeps &amp; Dark Pools
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Unlimited Tactical AI Agent Chat Access
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span> 4-Node Autonomous AI Swarm Background Scraping
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleUpgrade("vip")}
            disabled={loadingCheckout}
            className={"w-full py-3.5 rounded-xl text-xs font-bold font-mono tracking-widest uppercase transition shadow-lg " + (
              currentTier === "vip"
                ? "bg-green-500/20 text-green-300 border border-green-500/40 cursor-default"
                : "bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:brightness-110 shadow-yellow-500/20"
            )}
          >
            {loadingCheckout
              ? "CONNECTING TO CHECKOUT..."
              : currentTier === "vip"
              ? "✓ ELITE INSIDER ACTIVE"
              : "👑 UNLOCK ELITE INSIDER PASS ($25/wk)"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-muted font-mono pt-4 border-t border-border/30">
        Cancel anytime with one click · Direct SEC EDGAR and exchange level streaming · 256-bit encryption
      </div>
    </div>
  );
}
