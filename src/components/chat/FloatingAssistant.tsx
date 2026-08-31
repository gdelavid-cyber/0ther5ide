"use client";

import { useState } from "react";
import AgentChat from "./AgentChat";

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-mono">
      {/* Expanded Floating Assistant Modal */}
      {isOpen ? (
        <div
          className={`bg-bg/95 backdrop-blur-2xl border-2 border-accent/60 rounded-2xl shadow-[0_0_50px_rgba(0,255,136,0.25)] flex flex-col transition-all overflow-hidden animate-fade-in ${
            isExpanded
              ? "w-[94vw] md:w-[720px] h-[86vh] md:h-[700px]"
              : "w-[92vw] sm:w-[440px] md:w-[480px] h-[560px]"
          }`}
        >
          {/* Floating Window Titlebar */}
          <div className="bg-surface/90 border-b border-border/50 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
              <span className="text-xs font-bold text-accent tracking-wider font-mono">0ther5ide AI CO-PILOT</span>
              <span className="text-[10px] text-muted hidden sm:inline">· OPENROUTER LIVE</span>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-0.5 rounded bg-surface border border-border/50 hover:border-accent hover:text-fg transition font-bold"
                title={isExpanded ? "Restore standard size" : "Expand window"}
              >
                {isExpanded ? "⤢ STANDARD" : "⤡ EXPAND"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded flex items-center justify-center bg-red-500/10 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300 transition font-bold text-sm"
                title="Close assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Embedded Agent Chat Engine */}
          <div className="flex-1 min-h-0">
            <AgentChat />
          </div>
        </div>
      ) : (
        /* Collapsed Floating Action Button (FAB) */
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-full bg-bg/95 hover:bg-surface text-accent border-2 border-accent shadow-[0_0_30px_rgba(0,255,136,0.3)] backdrop-blur-2xl transition-all hover:scale-105 active:scale-95 group"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-90" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
          </span>
          <span className="text-xs font-bold tracking-wider font-mono text-accent">⚡ AI CO-PILOT (OPEN)</span>
          <span className="text-xs bg-accent/20 px-2 py-0.5 rounded border border-accent/40 text-accent group-hover:bg-accent group-hover:text-bg transition">
            LIVE 💬
          </span>
        </button>
      )}
    </div>
  );
}
