"use client";

import { useState, useRef, useEffect } from "react";
import AgentChat from "./AgentChat";

export default function FloatingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Position state (null = use CSS default initial position)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });
  const floatingRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("0ther5ide_assistant_pos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          // Clamp within window boundaries
          const clampedX = Math.max(10, Math.min(window.innerWidth - 80, parsed.x));
          const clampedY = Math.max(10, Math.min(window.innerHeight - 80, parsed.y));
          setPosition({ x: clampedX, y: clampedY });
        }
      }
    } catch {}
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header or main handle
    const target = e.target as HTMLElement;
    if (target.closest("button") && !target.closest(".drag-handle")) return;

    if (!floatingRef.current) return;
    const rect = floatingRef.current.getBoundingClientRect();
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position ? position.x : rect.left,
      startY: position ? position.y : rect.top,
    };

    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const newX = Math.max(10, Math.min(window.innerWidth - 70, dragStartRef.current.startX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 70, dragStartRef.current.startY + deltaY));

    const newPos = { x: newX, y: newY };
    setPosition(newPos);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        if (position) {
          localStorage.setItem("0ther5ide_assistant_pos", JSON.stringify(position));
        }
      } catch {}
    }
  };

  const resetPosition = () => {
    setPosition(null);
    try {
      localStorage.removeItem("0ther5ide_assistant_pos");
    } catch {}
  };

  const [zIndex, setZIndex] = useState(99999);
  const bringToFront = () => setZIndex(Date.now() % 1000000 + 999999);

  // Determine inline styles for draggable positioning
  const style: React.CSSProperties = position
    ? {
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: "auto",
        right: "auto",
        zIndex: zIndex,
      }
    : {
        position: "fixed",
        bottom: "75px", // Default 75px on mobile to clear bottom dock
        right: "16px",
        zIndex: zIndex,
      };

  return (
    <div
      ref={floatingRef}
      style={style}
      onClick={bringToFront}
      className="font-mono touch-none select-none"
    >
      {/* Expanded Floating Assistant Modal */}
      {isOpen ? (
        <div
          className={`bg-[#06080d]/95 backdrop-blur-2xl border-2 border-accent/60 rounded-2xl shadow-[0_0_50px_rgba(0,255,136,0.25)] flex flex-col transition-all overflow-hidden animate-fade-in ${
            isExpanded
              ? "w-[94vw] md:w-[720px] h-[82vh] md:h-[700px]"
              : "w-[90vw] sm:w-[440px] md:w-[480px] h-[520px]"
          }`}
        >
          {/* Floating Window Titlebar (Draggable Handle) */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="bg-surface/95 border-b border-border/50 px-3.5 py-2.5 flex items-center justify-between cursor-move drag-handle active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <span className="text-muted text-xs tracking-tighter select-none">⋮⋮</span>
              <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
              <span className="text-xs font-bold text-accent tracking-wider font-mono">0ther5ide AI CO-PILOT</span>
              <span className="text-[9px] text-muted hidden sm:inline">· ✋ DRAG ME ANYWHERE</span>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <button
                onClick={resetPosition}
                className="px-1.5 py-0.5 rounded bg-surface border border-border/40 hover:border-accent hover:text-accent transition text-[9px]"
                title="Reset to default position"
              >
                ⟲ DOCK
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-0.5 rounded bg-surface border border-border/50 hover:border-accent hover:text-fg transition font-bold text-[10px]"
                title={isExpanded ? "Restore standard size" : "Expand window"}
              >
                {isExpanded ? "⤢ STD" : "⤡ EXPAND"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center bg-red-500/10 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300 transition font-bold text-xs"
                title="Close assistant"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Embedded Agent Chat Engine */}
          <div className="flex-1 min-h-0 select-text">
            <AgentChat />
          </div>
        </div>
      ) : (
        /* Collapsed Floating Action Button (FAB - Freely Draggable with Touch) */
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center gap-2 p-1 rounded-full bg-bg/95 border-2 border-accent shadow-[0_0_30px_rgba(0,255,136,0.35)] backdrop-blur-2xl cursor-move drag-handle active:cursor-grabbing hover:scale-105 transition-transform"
        >
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-surface/80 hover:bg-surface text-accent transition"
          >
            <span className="text-muted text-[10px]">⋮⋮</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-90" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
            </span>
            <span className="text-xs font-extrabold tracking-wider font-mono text-accent">⚡ AI CO-PILOT</span>
            <span className="text-[10px] bg-accent/20 px-1.5 py-0.5 rounded border border-accent/40 text-accent font-bold">
              💬 OPEN
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
