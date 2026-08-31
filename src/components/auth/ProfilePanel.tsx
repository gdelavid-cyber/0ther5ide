"use client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; email: string; avatar: string } | null;
  planTier: "recon" | "vip";
  onUpgradeClick: () => void;
  onSignOut: () => void;
}

export default function ProfilePanel({
  isOpen,
  onClose,
  user,
  planTier,
  onUpgradeClick,
  onSignOut,
}: Props) {
  if (!isOpen || !user) return null;

  const handleSignOutClick = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {}
    onSignOut();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-14 right-4 z-50 w-72 bg-[#0d1117] border border-border/80 rounded-2xl shadow-2xl p-4 font-mono text-xs text-fg animate-fade-in space-y-3">
        {/* User Card */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/30">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-full border border-accent/40 object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-white truncate font-sans text-sm">{user.name}</div>
            <div className="text-[10px] text-muted truncate font-sans">{user.email}</div>
          </div>
        </div>

        {/* Plan & Usage Metrics */}
        <div className="p-2.5 rounded-lg bg-surface/50 border border-border/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted uppercase">Active Plan</span>
            <span className={"px-2 py-0.5 rounded text-[9px] font-bold " + (
              planTier === "vip"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                : "bg-accent/20 text-accent border border-accent/40"
            )}>
              {planTier === "vip" ? "VIP INSIDER" : "RECON (FREE)"}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-muted">
              <span>Chart Analyses:</span>
              <span className="text-fg font-bold">{planTier === "vip" ? "UNLIMITED" : "1 / 1 Daily"}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted">
              <span>Agent Inquiries:</span>
              <span className="text-fg font-bold">{planTier === "vip" ? "UNLIMITED" : "5 / 5 Daily"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {planTier !== "vip" && (
            <button
              onClick={() => { onUpgradeClick(); onClose(); }}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-yellow-500/30 to-amber-500/20 border border-yellow-400/50 hover:border-yellow-300 text-yellow-300 font-bold text-xs uppercase tracking-wider transition font-sans shadow-md"
            >
              👑 Upgrade to VIP
            </button>
          )}
          <button
            onClick={handleSignOutClick}
            className="w-full py-2 rounded-lg bg-surface hover:bg-border/40 text-muted hover:text-white transition text-xs"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
