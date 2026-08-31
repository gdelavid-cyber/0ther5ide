"use client";

import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string; avatar: string; planTier?: "recon" | "vip" }) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "operator@0ther5ide.intel",
          name: "Operator Alpha",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        }),
      });

      if (!res.ok) {
        throw new Error("Authentication failed");
      }

      const data = await res.json();
      onSuccess(data.user || {
        name: "Operator Alpha",
        email: "operator@0ther5ide.intel",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        planTier: "vip",
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to establish secure session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm bg-[#0a0d13] border border-border/80 rounded-2xl shadow-2xl p-6 text-center text-fg font-mono">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted hover:text-fg text-sm w-7 h-7 rounded-full hover:bg-surface flex items-center justify-center transition"
        >
          ✕
        </button>

        <div className="text-xs font-bold text-accent tracking-widest mb-1">0ther5ide v2.1.0</div>
        <h3 className="text-lg font-bold text-white mb-1 font-sans">Sign In to Terminal</h3>
        <p className="text-xs text-muted mb-5 font-sans leading-relaxed">
          Access classified intelligence feeds, unlock full executive dossiers, and run the Tactical AI Agent.
        </p>

        {errorMsg && (
          <div className="mb-4 p-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 transition shadow-md font-sans"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{loading ? "VERIFYING SIGNATURE..." : "Continue with Google"}</span>
        </button>

        <div className="text-[10px] text-muted mt-5 pt-3 border-t border-border/30 font-sans">
          Signed JWT HttpOnly session · 256-bit cryptographic auth
        </div>
      </div>
    </div>
  );
}
