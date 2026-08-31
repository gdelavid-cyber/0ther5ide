"use client";

import { useState } from "react";
import AgentChat from "./AgentChat";

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono">
      {/* Expanded Floating Assistant Modal */}
      {isOpen ? (
        <div
          className={`bg-bg/95 backdrop-blur-2xl border border-accent/50 rounded-2xl shadow-2xl flex flex-col transition-all overflow-hidden animate-fade-in ${
            isExpanded
              ? "w-[94vw] md:w-[680px] h-[82vh] md:h-[650px]"
              : "w-[92vw] sm:w-[420px] md:w-[460px] h-[520px]"
          }`}
        >
          {/* Floating Window Titlebar */}
          <div className="bg-surface/90 border-b border-border/50 px-3.5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
              <span className="text-xs font-bold text-accent tracking-wider">0ther5ide AI CO-PILOT</span>
              <span className="text-[9px] text-muted hidden sm:inline">· OPENROUTER LIVE</span>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface hover:text-fg transition"
                title={isExpanded ? "Restore standard size" : "Expand window"}
              >
                {isExpanded ? "⤢" : "⤡"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition font-bold"
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
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-surface/90 hover:bg-surface text-accent border border-accent/50 shadow-2xl backdrop-blur-xl transition-all hover:scale-105 active:scale-95 group"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
          </span>
          <span className="text-xs font-bold tracking-wider font-mono">05 CO-PILOT (AI)</span>
          <span className="text-[10px] text-muted group-hover:text-fg transition">💬</span>
        </button>
      )}
    </div>
  );
}
