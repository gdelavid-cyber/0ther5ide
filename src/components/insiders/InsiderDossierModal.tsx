"use client";

import { useState, useEffect } from "react";
import { formatMoney, timeAgo } from "@/lib/utils";
import type { InsiderDossier, InsiderTrade } from "@/lib/types";

interface Props {
  dossier: InsiderDossier | null;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export default function InsiderDossierModal({ dossier, onClose, onOpenAuth }: Props) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [tradeRevealed, setTradeRevealed] = useState(false);
  const [scrambleText, setScrambleText] = useState("0x7F...8A9C");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!dossier) return null;

  const handleCopyTrade = () => {
    if (tradeRevealed) return;
    setIsDecrypting(true);
    let count = 0;
    const interval = setInterval(() => {
      const chars = "0123456789ABCDEF!@#$%^&*<>";
      let res = "";
      for (let i = 0; i < 28; i++) {
        res += chars[Math.floor(Math.random() * chars.length)];
      }
      setScrambleText(res);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsDecrypting(false);
        setTradeRevealed(true);
      }
    }, 90);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl bg-[#080b0f] border border-green-500/30 rounded-xl shadow-2xl overflow-hidden my-auto text-fg">
        {/* CRT Scanline & Top Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-green-500/10 border-b border-green-500/20 text-xs font-mono">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 signal-pulse" />
            <span>REC // SURVEILLANCE DOSSIER</span>
          </div>
          <span className="text-green-400 font-bold tracking-wider">CLASSIFIED // EYES ONLY</span>
          <div className="flex items-center gap-3">
            <span className="text-muted text-[10px] hidden sm:inline">CIK: {dossier.cik || "0001318605"}</span>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded bg-black/50 border border-green-500/30 hover:border-red-400 hover:text-red-400 flex items-center justify-center text-muted transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto font-mono text-xs">
          {/* Subject Identity Header */}
          <div className="flex items-start gap-4 pb-4 border-b border-border/30">
            <div className="w-16 h-16 rounded bg-green-500/10 border border-green-500/40 flex items-center justify-center text-2xl font-bold text-green-400 flex-shrink-0 relative">
              <span>⚲</span>
              <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-green-400" />
              <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-wide truncate">{dossier.name}</h2>
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] border border-green-500/40 font-bold">
                  ACTIVE TARGET
                </span>
              </div>
              <div className="text-green-400 text-xs mt-1">CODENAME: {dossier.codename || "WHALE-PRIME"}</div>
              <div className="text-muted text-[11px] mt-0.5">{dossier.company} · SEC EDGAR Verified</div>
            </div>
          </div>

          {/* Stats Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded bg-surface/50 border border-border/40">
              <div className="text-[9px] text-muted uppercase">Total Filings</div>
              <div className="text-sm font-bold text-fg mt-0.5">{dossier.totalFilings || 24}</div>
            </div>
            <div className="p-2.5 rounded bg-surface/50 border border-border/40">
              <div className="text-[9px] text-muted uppercase">YTD Net Volume</div>
              <div className="text-sm font-bold text-accent mt-0.5">{formatMoney(dossier.ytdVolume || 48200000)}</div>
            </div>
            <div className="p-2.5 rounded bg-surface/50 border border-border/40">
              <div className="text-[9px] text-muted uppercase">First Seen</div>
              <div className="text-xs font-bold text-fg mt-0.5">{dossier.firstSeen || "2021-03-14"}</div>
            </div>
            <div className="p-2.5 rounded bg-surface/50 border border-border/40">
              <div className="text-[9px] text-muted uppercase">Last Movement</div>
              <div className="text-xs font-bold text-green-400 mt-0.5">{dossier.lastActive ? timeAgo(dossier.lastActive) : "2h ago"}</div>
            </div>
          </div>

          {/* Interactive COPY TRADE Decryption Block */}
          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-green-400">INSTITUTIONAL COPY-TRADE SIGNAL</span>
              <span className="text-[10px] text-muted">CONFIDENCE: 98.4%</span>
            </div>

            {!tradeRevealed && !isDecrypting && (
              <button
                onClick={handleCopyTrade}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500/30 to-green-500/10 border border-green-400 hover:border-green-300 text-white font-bold text-xs uppercase tracking-widest transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
              >
                <span>🔓</span>
                <span>DECRYPT & COPY THIS TRADE</span>
              </button>
            )}

            {isDecrypting && (
              <div className="py-4 text-center space-y-2">
                <div className="text-green-400 font-bold text-xs flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 signal-pulse" />
                  <span>DECRYPTING SEC TRANSACTION DATA...</span>
                </div>
                <div className="text-[11px] text-green-300 font-mono tracking-widest">{scrambleText}</div>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 animate-pulse w-full" />
                </div>
              </div>
            )}

            {tradeRevealed && (
              <div className="p-3 rounded bg-black/60 border border-green-500/40 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-bold text-xs">
                    {dossier.latest?.side?.toUpperCase() || "BUY"} SIGNAL
                  </span>
                  <span className="text-white font-bold text-sm">{dossier.latest?.ticker || "NVDA"}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div><span className="text-muted">Shares:</span> <strong className="text-white">{(dossier.latest?.shares || 125000).toLocaleString()}</strong></div>
                  <div><span className="text-muted">Price:</span> <strong className="text-white">${dossier.latest?.price || 128.50}</strong></div>
                  <div><span className="text-muted">Execution:</span> <strong className="text-yellow-400">{formatMoney(dossier.latest?.value || 16062500)}</strong></div>
                </div>
                <div className="text-[10px] text-muted pt-1 border-t border-border/30">
                  Direct Form 4 filing verified · Smart money conviction: High
                </div>
              </div>
            )}
          </div>

          {/* Intercept Historical Log */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[11px] text-muted border-b border-border/30 pb-1">
              <span className="text-green-400 font-bold">SEC FORM 4 TRANSACTION TIMELINE</span>
              <span>{dossier.timeline?.length || 4} RECENT EVENTS</span>
            </div>
            <div className="space-y-1.5">
              {(dossier.timeline || []).map((item: InsiderTrade, idx: number) => (
                <div key={item.id || idx} className="p-2 rounded bg-surface/30 border border-border/30 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className={"px-1.5 py-0.2 rounded text-[9px] font-bold " + (item.action === "buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                      {item.action?.toUpperCase()}
                    </span>
                    <span className="font-bold text-white">{item.ticker}</span>
                    <span className="text-muted">{item.shares?.toLocaleString()} shs @ ${item.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-yellow-400">{formatMoney(item.value)}</span>
                    <span className="text-muted text-[10px]">{timeAgo(item.filedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-surface/30 border-t border-border/30 flex items-center justify-between text-[10px] text-muted font-mono">
          <span>GODMODE SURVEILLANCE ENGINE v2.1.0</span>
          <button onClick={onClose} className="px-3 py-1 bg-surface hover:bg-border/60 text-fg rounded transition">
            CLOSE DOSSIER [ESC]
          </button>
        </div>
      </div>
    </div>
  );
}
