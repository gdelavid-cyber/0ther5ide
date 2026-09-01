"use client";

import { useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import ProfilePanel from "@/components/auth/ProfilePanel";

interface NavigationProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  user?: { name: string; email: string; avatar: string } | null;
  planTier?: "recon" | "vip";
  onUserChange?: (user: { name: string; email: string; avatar: string } | null) => void;
  onPlanChange?: (tier: "recon" | "vip") => void;
}

const NAV_ITEMS = [
  { id: "all", label: "OVERVIEW", icon: "⊞", isLocked: false },
  { id: "globe", label: "GLOBE", icon: "◎", isLocked: false },
  { id: "agent", label: "AI CO-PILOT", icon: "🤖", isLocked: false, isFreeBadge: true },
  { id: "flow", label: "FLOW", icon: "⚡", isLocked: true },
  { id: "insiders", label: "INSIDERS", icon: "⚲", isLocked: true },
  { id: "intel", label: "INTEL", icon: "◆", isLocked: true },
  { id: "swarm", label: "SWARM", icon: "🛰️", isLocked: true },
  { id: "backtest", label: "BACKTEST", icon: "📊", isLocked: false },
  { id: "pricing", label: "ELITE PASS", icon: "👑", isLocked: false },
  { id: "admin", label: "ADMIN", icon: "⚙", isLocked: false },
];

export default function Navigation({
  activeTab: externalTab,
  onSelectTab,
  user = null,
  planTier = "recon",
  onUserChange,
  onPlanChange,
}: NavigationProps) {
  const [internalTab, setInternalTab] = useState("all");
  const activeTab = externalTab !== undefined ? externalTab : internalTab;
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    if (onSelectTab) {
      onSelectTab(tabId);
    } else {
      setInternalTab(tabId);
    }
  };

  return (
    <>
      <nav className="navbar fixed top-0 left-0 right-0 z-40 bg-bg/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleTabClick("all")}>
              <div className="w-6 h-6 rounded bg-accent/20 border border-accent/30 flex items-center justify-center">
                <span className="text-accent text-xs font-bold">05</span>
              </div>
              <span className="text-accent font-bold text-sm tracking-wider">0ther5ide</span>
              <span className="text-[9px] text-muted bg-surface px-1.5 py-0.5 rounded border border-border/50">v2.1.0</span>
            </div>
            <div className="hidden md:flex items-center gap-1 ml-4">
              {NAV_ITEMS.map((item) => {
                const locked = item.isLocked && planTier !== "vip";
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={"px-2 py-1 text-[10px] uppercase tracking-wider rounded transition flex items-center gap-1.5 " + (
                      activeTab === item.id
                        ? "bg-accent/10 text-accent border-b-2 border-accent font-bold"
                        : locked
                        ? "text-muted/70 hover:text-yellow-400"
                        : "text-muted hover:text-fg/80"
                    )}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    {locked && <span className="text-[9px] text-yellow-400">🔒</span>}
                    {item.isFreeBadge && <span className="text-[8px] bg-accent/20 text-accent px-1 rounded">FREE</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tier Status Badge */}
            <button
              onClick={() => handleTabClick("pricing")}
              className={"hidden sm:flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold transition " + (
                planTier === "vip"
                  ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:border-yellow-400"
                  : "bg-surface text-muted border-border/60 hover:text-fg hover:border-accent/40"
              )}
            >
              <span className={"w-1.5 h-1.5 rounded-full signal-pulse " + (planTier === "vip" ? "bg-yellow-400" : "bg-accent")} />
              <span>{planTier === "vip" ? "👑 VIP INSIDER" : "RECON TIER"}</span>
            </button>

            {/* User Auth / Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 rounded-full border border-border/60 hover:border-accent transition"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </button>
                <ProfilePanel
                  isOpen={profileOpen}
                  onClose={() => setProfileOpen(false)}
                  user={user}
                  planTier={planTier}
                  onUpgradeClick={() => handleTabClick("pricing")}
                  onSignOut={() => onUserChange && onUserChange(null)}
                />
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="text-xs text-muted hover:text-fg transition hidden sm:flex items-center gap-1.5 font-sans"
              >
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-fg text-lg px-1"
            >
              ☰
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-xl md:hidden">
          <div className="p-4 space-y-2">
            <button onClick={() => setMenuOpen(false)} className="text-fg text-sm mb-4">✕ Close</button>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { handleTabClick(item.id); setMenuOpen(false); }}
                className={"block w-full text-left px-3 py-2 text-sm rounded font-mono " + (
                  activeTab === item.id ? "bg-accent/20 text-accent font-bold" : "text-fg hover:bg-surface"
                )}
              >
                {item.icon} {item.label}
              </button>
            ))}
            {!user ? (
              <button
                onClick={() => { setAuthOpen(true); setMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-accent hover:bg-surface rounded mt-2 font-mono"
              >
                Sign in with Google
              </button>
            ) : (
              <button
                onClick={() => { onUserChange && onUserChange(null); setMenuOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-surface rounded mt-2 font-mono"
              >
                Sign Out ({user.name})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(newUser) => {
          if (onUserChange) onUserChange(newUser);
        }}
      />
    </>
  );
}
