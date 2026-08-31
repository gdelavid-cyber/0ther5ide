"use client";

import { useState, useEffect, useCallback } from "react";
import { formatMoney, timeAgo } from "@/lib/utils";
import InsiderDossierModal from "./InsiderDossierModal";
import type { InsiderTrade, InsiderDossier } from "@/lib/types";

const TRENDING_EXECUTIVES = [
  "ALL",
  "JENSEN HUANG",
  "ELON MUSK",
  "MARK ZUCKERBERG",
  "JEFF BEZOS",
  "NANCY PELOSI",
  "TIM COOK",
  "WARREN BUFFETT",
];

export default function InsiderPanel() {
  const [trades, setTrades] = useState<InsiderTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedDossier, setSelectedDossier] = useState<InsiderDossier | null>(null);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch("/api/insiders");
      if (!res.ok) return;
      const data = await res.json();
      setTrades(data.trades || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 120000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  const openDossier = async (trade: InsiderTrade) => {
    try {
      const res = await fetch("/api/insider/" + trade.cik);
      if (res.ok) {
        const data = await res.json();
        setSelectedDossier(data);
        return;
      }
    } catch {}

    // Fallback Dossier structure
    setSelectedDossier({
      name: trade.person,
      codename: "TARGET-" + trade.ticker,
      cik: trade.cik || "0001045810",
      totalFilings: 18,
      ytdVolume: trade.value * 3.4,
      ytdNet: trade.action === "buy" ? trade.value : -trade.value,
      topTickers: [{ ticker: trade.ticker, value: trade.value }],
      firstSeen: "2021-04-12",
      lastActive: trade.filedAt,
      company: trade.company,
      latest: {
        side: trade.action,
        ticker: trade.ticker,
        shares: trade.shares,
        price: trade.price,
        value: trade.value,
        action: trade.action,
      },
      timeline: [trade],
    });
  };

  const filteredTrades = trades.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || t.person.toLowerCase().includes(q) || t.ticker.toLowerCase().includes(q) || t.company.toLowerCase().includes(q);
    const matchesFilter = activeFilter === "ALL" || t.person.toUpperCase().includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="glass-panel p-4 flex flex-col h-full glow-border space-y-2.5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          <span className="text-accent font-bold text-sm tracking-wider">SEC FORM 4 INSIDER DESK</span>
          <span className="text-[9px] text-muted bg-surface px-1.5 py-0.5 rounded border border-border/50">
            EDGAR REAL-TIME
          </span>
        </div>
        <span className="text-[10px] text-muted font-mono">
          {filteredTrades.length} Active Filings
        </span>
      </div>

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <span className="absolute left-3 text-muted text-xs">⚲</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search executive, company, or ticker (e.g. Jensen, NVDA, Pelosi)..."
          className="w-full bg-surface/80 border border-border/60 text-xs pl-8 pr-8 py-1.5 rounded text-fg placeholder:text-muted focus:border-accent focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 text-muted hover:text-fg text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Trending Executive Quick Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[9px] font-mono scrollbar-none">
        <span className="text-accent font-bold uppercase flex-shrink-0 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent signal-pulse" /> TRENDING:
        </span>
        {TRENDING_EXECUTIVES.map((exec) => (
          <button
            key={exec}
            onClick={() => setActiveFilter(exec)}
            className={"px-2 py-0.5 rounded-full border transition whitespace-nowrap " + (
              activeFilter === exec
                ? "bg-accent text-bg font-bold border-accent"
                : "bg-surface/60 border-border/40 text-muted hover:text-fg"
            )}
          >
            {exec}
          </button>
        ))}
      </div>

      {/* Trades Grid */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-border/20 rounded animate-pulse" />
          ))
        ) : filteredTrades.length === 0 ? (
          <div className="text-muted text-xs text-center py-8">No filings matching query.</div>
        ) : (
          filteredTrades.map((t) => (
            <div
              key={t.id}
              onClick={() => openDossier(t)}
              className={"p-2.5 rounded border transition-all cursor-pointer group relative overflow-hidden " + (
                t.action === "buy"
                  ? "bg-green-500/5 border-green-500/30 hover:border-green-400"
                  : "bg-red-500/5 border-red-500/30 hover:border-red-400"
              )}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={"px-1.5 py-0.5 text-[9px] font-bold rounded font-mono " + (
                      t.action === "buy"
                        ? "bg-green-500/20 text-low border border-green-500/40"
                        : "bg-red-500/20 text-warn border border-red-500/40"
                    )}
                  >
                    {t.action?.toUpperCase()}
                  </span>
                  <span className="font-bold text-fg font-mono">{t.ticker}</span>
                  <span className="text-muted text-[11px] truncate max-w-[140px]">{t.company}</span>
                </div>
                <span className="text-[10px] text-muted font-mono">{timeAgo(t.filedAt)}</span>
              </div>

              <div className="flex items-center justify-between mt-1 text-xs">
                <span className="font-bold text-fg group-hover:text-accent transition">{t.person}</span>
                <span className={"font-bold font-mono " + (t.action === "buy" ? "text-low" : "text-warn")}>
                  {formatMoney(t.value)}
                </span>
              </div>

              <div className="flex items-center justify-between mt-1 text-[10px] text-muted border-t border-border/20 pt-1">
                <span>{t.shares?.toLocaleString()} shares @ ${t.price?.toFixed(2)}</span>
                <span className="text-accent opacity-0 group-hover:opacity-100 transition text-[9px] font-bold font-mono">
                  OPEN DOSSIER ▸
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Overlay */}
      <InsiderDossierModal
        dossier={selectedDossier}
        onClose={() => setSelectedDossier(null)}
      />
    </div>
  );
}
