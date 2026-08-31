"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import AINotificationBar from "@/components/dashboard/AINotificationBar";
import FloatingAssistant from "@/components/chat/FloatingAssistant";
import BootSequence from "@/components/BootSequence";
import Navigation from "@/components/Navigation";
import TensionIndex from "./TensionIndex";
import IntelFeed from "./IntelFeed";
import InsiderPanel from "@/components/insiders/InsiderPanel";
import AgentChat from "@/components/chat/AgentChat";
import ChartAnalysis from "./ChartAnalysis";
import OrderFlowPanel from "./OrderFlowPanel";
import SwarmConsole from "@/components/swarm/SwarmConsole";
import PolymarketTracker from "@/components/dashboard/PolymarketTracker";
import PricingView from "@/components/pricing/PricingView";
import NewsTicker from "./NewsTicker";
import type { Signal, TensionIndex as TensionType } from "@/lib/types";

const GodModeGlobe = dynamic(() => import("@/components/globe/GodModeGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center rounded-lg border border-border/50 bg-surface/30">
      <div className="text-xs text-muted font-mono flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
        INITIALIZING 3D GLOBE PROJECTION...
      </div>
    </div>
  ),
});

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [tension, setTension] = useState<TensionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [planTier, setPlanTier] = useState<"recon" | "vip">("recon");
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/data");
      if (!res.ok) return;
      const data = await res.json();
      setSignals(data.signals || []);
      setTension(data.tension || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 150000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-bg pt-12">
      <BootSequence />
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        user={user}
        planTier={planTier}
        onUserChange={setUser}
        onPlanChange={setPlanTier}
      />
      <NewsTicker />

      <main className="max-w-[1920px] mx-auto px-3 py-3 space-y-3">
        {/* Top Row: Tension + Key Metrics (shown when not in Pricing tab) */}
        {activeTab !== "pricing" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <TensionIndex data={tension} />
            <div className="glass-panel p-4">
              <div className="text-muted text-xs uppercase tracking-wider mb-1">ACLED Events</div>
              <div className="text-3xl font-bold accent-text">{loading ? "--" : signals.length}</div>
              <div className="text-[10px] text-muted mt-1">conflict signals active</div>
            </div>
            <div className="glass-panel p-4">
              <div className="text-muted text-xs uppercase tracking-wider mb-1">Sources</div>
              <div className="text-3xl font-bold accent-text">{loading ? "--" : "5/5"}</div>
              <div className="text-[10px] text-muted mt-1">feeds online</div>
            </div>
            <div className="glass-panel p-4">
              <div className="text-muted text-xs uppercase tracking-wider mb-1">Account Tier</div>
              <div className={"text-lg font-bold font-mono uppercase mt-1 " + (planTier === "vip" ? "text-yellow-300" : "text-fg")}>
                {planTier === "vip" ? "👑 VIP INSIDER" : "RECON TIER"}
              </div>
              <div className="text-[10px] text-muted mt-1">
                {planTier === "vip" ? "unlimited access active" : "free plan · upgrade anytime"}
              </div>
            </div>
          </div>
        )}

        {/* Tab-driven layout */}
        {activeTab === "all" && (
          <>
            {/* Live AI Intelligence Notification Bar */}
          <div>
            <AINotificationBar />
          </div>

          {/* Top Strategic Command: 3D Globe + Tactical AI Co-Pilot Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 h-[480px] md:h-[520px]">
                <GodModeGlobe signals={signals} height={500} />
              </div>
              <div className="lg:col-span-1 h-[480px] md:h-[520px]">
                <AgentChat />
              </div>
            </div>

            {/* Autonomous AI Swarm Command Center */}
            <div>
              <SwarmConsole />
            </div>

            {/* Live Polymarket Crisis & Geopolitical Odds */}
            <div>
              <PolymarketTracker />
            </div>

            {/* Middle Row: Elite Order Flow & Institutional Liquidity */}
            <div className="h-[480px]">
              <OrderFlowPanel />
            </div>

            {/* Bottom Row 1: Primary Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="h-[440px]">
                <IntelFeed />
              </div>
              <div className="h-[440px]">
                <InsiderPanel />
              </div>
            </div>

            {/* Bottom Row 2: Chart Analysis & Signal Guide */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="h-[340px]">
                <ChartAnalysis />
              </div>
              <div className="glass-panel p-4 flex flex-col justify-between">
                <div>
                  <div className="text-muted text-xs uppercase tracking-wider mb-2">SIGNAL GUIDE &amp; THREAT TAXONOMY</div>
                  <div className="grid grid-cols-2 gap-3 text-xs mt-2">
                    {[
                      { label: "SEVERE", color: "text-red-400", badge: "bg-red-500/20 border-red-500/40", desc: "Active kinetic conflict / high fatality engagements" },
                      { label: "HIGH", color: "text-orange-400", badge: "bg-orange-500/20 border-orange-500/40", desc: "Escalating troop movements / ADIZ violations" },
                      { label: "ELEVATED", color: "text-yellow-400", badge: "bg-yellow-500/20 border-yellow-500/40", desc: "Thermal anomalies / maritime patrol friction" },
                      { label: "LOW", color: "text-green-400", badge: "bg-green-500/20 border-green-500/40", desc: "Baseline surveillance & commercial vector tracking" },
                    ].map((item) => (
                      <div key={item.label} className={"p-2.5 rounded border " + item.badge}>
                        <div className={"font-bold " + item.color + " mb-1"}>{item.label}</div>
                        <div className="text-[11px] text-muted leading-snug">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] text-muted pt-3 mt-3 border-t border-border/30 flex items-center justify-between font-mono">
                  <span>0ther5ide ENGINE v2.1.0</span>
                  <span className="text-accent">ENCRYPTED STREAM ACTIVE</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "swarm" && (
          <div className="space-y-3">
            <SwarmConsole />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2 h-[480px]">
                <GodModeGlobe signals={signals} height={470} />
              </div>
              <div className="lg:col-span-1 h-[480px]">
                <AgentChat />
              </div>
            </div>
          </div>
        )}

        {activeTab === "flow" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 h-[740px]">
              <OrderFlowPanel />
            </div>
            <div className="lg:col-span-1 space-y-3">
              <div className="h-[360px]">
                <ChartAnalysis />
              </div>
              <div className="h-[360px]">
                <AgentChat />
              </div>
            </div>
          </div>
        )}

        {activeTab === "globe" && (
          <div className="space-y-3">
            <div className="h-[650px] w-full">
              <GodModeGlobe signals={signals} height={640} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="h-[360px]">
                <IntelFeed />
              </div>
              <div className="h-[360px]">
                <InsiderPanel />
              </div>
            </div>
          </div>
        )}

        {activeTab === "intel" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 h-[720px]">
              <IntelFeed />
            </div>
            <div className="lg:col-span-1 space-y-3">
              <div className="h-[350px]">
                <GodModeGlobe signals={signals} height={340} />
              </div>
              <div className="h-[350px]">
                <AgentChat />
              </div>
            </div>
          </div>
        )}

        {activeTab === "insiders" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 h-[740px]">
              <InsiderPanel />
            </div>
            <div className="lg:col-span-1 space-y-3">
              <div className="h-[360px]">
                <ChartAnalysis />
              </div>
              <div className="h-[360px]">
                <AgentChat />
              </div>
            </div>
          </div>
        )}

        {activeTab === "agent" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[740px]">
            <div className="h-full">
              <AgentChat />
            </div>
            <div className="h-full flex flex-col gap-3">
              <div className="flex-1">
                <ChartAnalysis />
              </div>
              <div className="h-[300px]">
                <GodModeGlobe signals={signals} height={290} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "poly" && (
          <div className="min-h-[600px]">
            <PolymarketTracker />
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="min-h-[700px]">
            <PricingView
              currentTier={planTier}
              onSelectTier={setPlanTier}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Dock (Optimized for Smartphone Operators) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#06080d]/95 border-t border-border/60 backdrop-blur-xl px-2 py-2 flex items-center justify-around font-mono text-[9px]">
        {[
          { id: "all", label: "OVERVIEW", icon: "⊞" },
          { id: "globe", label: "GLOBE", icon: "◎" },
          { id: "agent", label: "AI CO-PILOT", icon: "🤖" },
          { id: "flow", label: "FLOW", icon: "⚡" },
          { id: "poly", label: "POLY", icon: "🔮" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition ${
              activeTab === t.id
                ? "bg-accent/20 text-accent font-bold border border-accent/40"
                : "text-muted hover:text-fg"
            }`}
          >
            <span className="text-xs">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <FloatingAssistant />
    </div>
  );
}
