"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  planTier: "recon" | "vip";
  createdAt: string;
  updatedAt: string;
}

interface AdminStats {
  totalUsers: number;
  vipSubscribers: number;
  freeUsers: number;
  mrrEstimate: number;
}

export default function AdminConsole() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Inputs for Adding / Modifying Users
  const [targetEmail, setTargetEmail] = useState("");
  const [targetTier, setTargetTier] = useState<"vip" | "recon">("vip");
  const [actionSuccess, setActionSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`/api/admin/users?key=${encodeURIComponent(passcode)}`);
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setUsers(data.users || []);
        setStats(data.stats || null);
        try { sessionStorage.setItem("0ther5ide_admin_key", passcode); } catch {}
      } else {
        setAuthError("Invalid Admin Passcode");
      }
    } catch {
      setAuthError("Failed to connect to Admin API");
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const key = passcode || (typeof window !== "undefined" ? sessionStorage.getItem("0ther5ide_admin_key") : "");
    if (!key) return;
    try {
      const res = await fetch(`/api/admin/users?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(data.stats || null);
      }
    } catch {}
  };

  const handleGrantUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail || !targetEmail.includes("@")) return;

    setLoading(true);
    setActionSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: passcode,
          email: targetEmail,
          planTier: targetTier,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActionSuccess(`✓ ${targetEmail} updated to ${targetTier.toUpperCase()} successfully!`);
        setTargetEmail("");
        fetchUsers();
        setTimeout(() => setActionSuccess(""), 4000);
      }
    } catch {}
    setLoading(false);
  };

  const handleToggleTier = async (email: string, currentTier: string) => {
    const newTier = currentTier === "vip" ? "recon" : "vip";
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: passcode,
          email,
          planTier: newTier,
        }),
      });
      fetchUsers();
    } catch {}
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Delete account for ${email}?`)) return;
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: passcode,
          email,
          action: "delete",
        }),
      });
      fetchUsers();
    } catch {}
  };

  // 1. Password Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[550px] flex items-center justify-center p-4 font-mono">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-[#06080d] border border-accent/50 shadow-[0_0_50px_rgba(0,255,136,0.2)] text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center text-2xl mx-auto shadow-lg shadow-accent/20">
            ⚙
          </div>
          <div>
            <div className="text-[10px] text-accent font-extrabold tracking-widest uppercase">
              CLASSIFIED COMMAND MATRIX
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-fg mt-1">
              0ther5ide ADMIN PORTAL
            </h1>
            <p className="text-xs text-muted mt-2">
              Enter master administrator secret key to manage accounts and provision VIP Insider access.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 pt-2">
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter Admin Key (Default: 05-ADMIN-2026)"
              className="w-full px-4 py-3 rounded-xl bg-surface/80 border border-border/60 text-fg text-xs focus:outline-none focus:border-accent font-mono text-center"
              required
            />

            {authError && <div className="text-red-400 text-xs font-bold">{authError}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent via-emerald-400 to-green-500 text-bg font-extrabold text-xs tracking-widest uppercase shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition"
            >
              {loading ? "AUTHENTICATING..." : "AUTHENTICATE ADMIN ACCESS"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Full Admin Dashboard
  return (
    <div className="glass-panel p-6 sm:p-8 space-y-6 font-mono max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
            <h1 className="text-xl font-bold text-fg tracking-wider">
              ADMIN ACCOUNT COMMAND CONSOLE
            </h1>
          </div>
          <p className="text-xs text-muted mt-1">
            Manage user directory, grant instant VIP Elite clearances, and monitor Stripe subscriber revenue.
          </p>
        </div>

        <button
          onClick={() => setIsAuthenticated(false)}
          className="px-3 py-1.5 rounded-lg bg-surface border border-border/60 text-muted hover:text-red-400 text-xs font-bold transition"
        >
          🔒 LOCK PORTAL
        </button>
      </div>

      {/* Revenue & Subscriber Stats Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-surface/50 border border-border/40">
            <div className="text-[10px] text-muted uppercase">Total Registered</div>
            <div className="text-2xl font-bold text-fg mt-1">{stats.totalUsers}</div>
            <div className="text-[9px] text-muted mt-0.5">user accounts in store</div>
          </div>
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="text-[10px] text-yellow-400 font-bold uppercase">👑 Elite Insiders</div>
            <div className="text-2xl font-bold text-yellow-300 mt-1">{stats.vipSubscribers}</div>
            <div className="text-[9px] text-yellow-400/70 mt-0.5">active VIP accounts</div>
          </div>
          <div className="p-4 rounded-xl bg-surface/50 border border-border/40">
            <div className="text-[10px] text-muted uppercase">Free Recon Users</div>
            <div className="text-2xl font-bold text-muted mt-1">{stats.freeUsers}</div>
            <div className="text-[9px] text-muted mt-0.5">standard tier</div>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="text-[10px] text-green-400 font-bold uppercase">Est. Monthly MRR</div>
            <div className="text-2xl font-bold text-green-400 mt-1">${stats.mrrEstimate.toLocaleString()}</div>
            <div className="text-[9px] text-green-400/70 mt-0.5">@ $25/week subscription</div>
          </div>
        </div>
      )}

      {/* Form: Add / Grant VIP by Email */}
      <div className="p-5 rounded-2xl bg-surface/40 border border-border/50 space-y-3">
        <div className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
          <span>👑</span>
          <span>PROVISION / UPGRADE USER ACCESS BY EMAIL</span>
        </div>
        <p className="text-[11px] text-muted">
          Add any customer or team email to instantly grant them full unredacted Elite Insider access without requiring Stripe payment.
        </p>

        <form onSubmit={handleGrantUser} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="user@example.com"
            className="sm:col-span-2 px-3 py-2 rounded-xl bg-bg border border-border/60 text-fg text-xs focus:outline-none focus:border-accent"
            required
          />

          <select
            value={targetTier}
            onChange={(e) => setTargetTier(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-bg border border-border/60 text-fg text-xs focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="vip">👑 ELITE INSIDER (VIP)</option>
            <option value="recon">FREE RECON TIER</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="py-2 rounded-xl bg-accent text-bg font-extrabold text-xs uppercase hover:brightness-110 active:scale-95 transition"
          >
            {loading ? "SAVING..." : "GRANT ACCESS"}
          </button>
        </form>

        {actionSuccess && (
          <div className="p-2.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold">
            {actionSuccess}
          </div>
        )}
      </div>

      {/* User Directory Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-fg uppercase tracking-wider">
            REGISTERED USER ACCOUNTS ({users.length})
          </div>
          <button
            onClick={fetchUsers}
            className="text-[10px] text-accent hover:underline flex items-center gap-1"
          >
            ⟲ REFRESH LIST
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/40 bg-surface/30">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface/80 border-b border-border/50 text-[10px] text-muted uppercase">
              <tr>
                <th className="p-3">User Email</th>
                <th className="p-3">Status / Clearance</th>
                <th className="p-3">Updated Date</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {users.map((u) => {
                const isVip = u.planTier === "vip";
                return (
                  <tr key={u.id || u.email} className="hover:bg-surface/60 transition">
                    <td className="p-3 font-bold text-fg flex items-center gap-2">
                      <span className="text-muted text-[10px]">👤</span>
                      <span>{u.email}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          isVip
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                            : "bg-surface text-muted border-border/60"
                        }`}
                      >
                        {isVip ? "👑 VIP INSIDER" : "FREE RECON"}
                      </span>
                    </td>
                    <td className="p-3 text-muted text-[10px]">
                      {new Date(u.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleToggleTier(u.email, u.planTier)}
                        className={`px-2 py-1 rounded text-[9px] font-bold border transition ${
                          isVip
                            ? "bg-surface border-border/50 text-muted hover:text-red-400"
                            : "bg-yellow-500/20 border-yellow-500/40 text-yellow-300 hover:bg-yellow-500/30"
                        }`}
                      >
                        {isVip ? "REVERT TO FREE" : "👑 MAKE VIP"}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.email)}
                        className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-[9px] font-bold transition"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
