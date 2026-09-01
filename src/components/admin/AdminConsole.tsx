"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

const LOCAL_STORAGE_USERS_KEY = "0ther5ide_admin_persisted_users";
const LOCAL_STORAGE_ADMIN_KEY = "0ther5ide_admin_key";

export default function AdminConsole() {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form Inputs for Adding / Modifying Users
  const [targetEmail, setTargetEmail] = useState("");
  const [targetTier, setTargetTier] = useState<"vip" | "recon">("vip");
  const [actionSuccess, setActionSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync users with localStorage and remote backend
  const syncWithLocalStorage = useCallback(async (adminKey: string, serverUsers: UserProfile[]) => {
    try {
      const storedRaw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
      const storedUsers: UserProfile[] = storedRaw ? JSON.parse(storedRaw) : [];

      // If localStorage has users not on server, sync them to server
      const serverEmails = new Set(serverUsers.map((u) => u.email.toLowerCase()));
      const missingOnServer = storedUsers.filter((u) => !serverEmails.has(u.email.toLowerCase()));

      if (missingOnServer.length > 0) {
        const syncRes = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: adminKey,
            action: "sync",
            users: storedUsers,
          }),
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.users) {
            setUsers(syncData.users);
            localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(syncData.users));
            return;
          }
        }
      }

      // Merge and save current server users to localStorage
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(serverUsers));
    } catch {}
  }, []);

  const verifyAndLogin = useCallback(async (keyToTest: string) => {
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch(`/api/admin/users?key=${encodeURIComponent(keyToTest)}`);
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setPasscode(keyToTest);
        setUsers(data.users || []);
        setStats(data.stats || null);
        try {
          sessionStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, keyToTest);
          localStorage.setItem(LOCAL_STORAGE_ADMIN_KEY, keyToTest);
        } catch {}
        await syncWithLocalStorage(keyToTest, data.users || []);
      } else {
        setAuthError("Invalid Admin Passcode");
      }
    } catch {
      setAuthError("Failed to connect to Admin API");
    }
    setLoading(false);
  }, [syncWithLocalStorage]);

  // Auto-login on mount if key is saved
  useEffect(() => {
    try {
      const savedKey = sessionStorage.getItem(LOCAL_STORAGE_ADMIN_KEY) || localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY);
      if (savedKey) {
        setPasscode(savedKey);
        verifyAndLogin(savedKey);
      }
    } catch {}
  }, [verifyAndLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    verifyAndLogin(passcode);
  };

  const fetchUsers = async () => {
    const key = passcode || (typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_ADMIN_KEY) || sessionStorage.getItem(LOCAL_STORAGE_ADMIN_KEY) : "");
    if (!key) return;
    try {
      const res = await fetch(`/api/admin/users?key=${encodeURIComponent(key)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setStats(data.stats || null);
        try { localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(data.users || [])); } catch {}
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
        setActionSuccess(`✓ ${targetEmail} permanently granted ${targetTier.toUpperCase()} clearance!`);
        setTargetEmail("");
        await fetchUsers();
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
      await fetchUsers();
    } catch {}
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Permanently delete account for ${email}?`)) return;
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
      await fetchUsers();
    } catch {}
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `0ther5ide_Users_Backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: passcode,
              action: "sync",
              users: parsed,
            }),
          });
          if (res.ok) {
            setActionSuccess(`✓ Successfully restored ${parsed.length} user accounts from backup file!`);
            await fetchUsers();
            setTimeout(() => setActionSuccess(""), 4000);
          }
        }
      } catch {
        alert("Failed to parse backup JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(LOCAL_STORAGE_ADMIN_KEY);
      localStorage.removeItem(LOCAL_STORAGE_ADMIN_KEY);
    } catch {}
  };

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.planTier.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              Enter master administrator secret key to manage accounts and provision persistent VIP Insider access.
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
            <h1 className="text-xl font-bold text-fg tracking-wider">
              ADMIN ACCOUNT COMMAND CONSOLE
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9.5px] font-bold">
              💾 PERSISTENT MULTI-LAYER STORAGE ACTIVE
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Manage user directory, grant permanent VIP Elite clearances, and sync data across disk, KV, and browser storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBackup}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border/60 text-fg hover:border-accent text-xs font-bold transition flex items-center gap-1.5"
            title="Download JSON backup of all users"
          >
            <span>📥 EXPORT JSON</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border/60 text-fg hover:border-accent text-xs font-bold transition flex items-center gap-1.5"
            title="Restore users from JSON backup"
          >
            <span>📤 RESTORE JSON</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-surface border border-border/60 text-muted hover:text-red-400 text-xs font-bold transition"
          >
            🔒 LOCK PORTAL
          </button>
        </div>
      </div>

      {/* Revenue & Subscriber Stats Banner */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-surface/50 border border-border/40">
            <div className="text-[10px] text-muted uppercase">Total Registered</div>
            <div className="text-2xl font-bold text-fg mt-1">{users.length}</div>
            <div className="text-[9px] text-emerald-400 mt-0.5 font-bold">✓ Persisted permanently</div>
          </div>
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="text-[10px] text-yellow-400 font-bold uppercase">👑 Elite Insiders</div>
            <div className="text-2xl font-bold text-yellow-300 mt-1">{users.filter(u => u.planTier === "vip").length}</div>
            <div className="text-[9px] text-yellow-400/70 mt-0.5">active VIP accounts</div>
          </div>
          <div className="p-4 rounded-xl bg-surface/50 border border-border/40">
            <div className="text-[10px] text-muted uppercase">Free Recon Users</div>
            <div className="text-2xl font-bold text-muted mt-1">{users.filter(u => u.planTier !== "vip").length}</div>
            <div className="text-[9px] text-muted mt-0.5">standard tier</div>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="text-[10px] text-green-400 font-bold uppercase">Est. Monthly MRR</div>
            <div className="text-2xl font-bold text-green-400 mt-1">{"$" + (users.filter(u => u.planTier === "vip").length * 100).toLocaleString()}</div>
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
          Add any customer or team email to permanently grant them unredacted VIP Elite clearance. Data is preserved across all server restarts and logins.
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

      {/* User Directory Table with Search Filter */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-fg uppercase tracking-wider">
            REGISTERED USER ACCOUNTS ({users.length})
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="px-3 py-1 rounded-lg bg-bg border border-border/60 text-fg text-xs focus:outline-none focus:border-accent"
            />

            <button
              onClick={fetchUsers}
              className="text-[10px] text-accent hover:underline flex items-center gap-1"
            >
              ⟲ REFRESH LIST
            </button>
          </div>
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted text-xs">
                    No matching user accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
