import fs from "fs";
import path from "path";
import os from "os";
import { logger } from "@/lib/logger";
import type { InsiderTrade } from "@/lib/types";
import type { SwarmLog } from "@/lib/swarm/types";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  planTier: "recon" | "vip";
  stripeCustomerId?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: Record<string, UserProfile>;
  swarmLogs: SwarmLog[];
  trades: InsiderTrade[];
  metrics: {
    totalSweeps: number;
    totalEventsHarvested: number;
  };
}

const DEFAULT_USERS: Record<string, UserProfile> = {
  "operator@0ther5ide.intel": {
    id: "usr_default_admin",
    email: "operator@0ther5ide.intel",
    name: "Operator Alpha",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    planTier: "vip",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  },
};

// In-memory cache
const memoryStore: DatabaseSchema = {
  users: { ...DEFAULT_USERS },
  swarmLogs: [],
  trades: [],
  metrics: {
    totalSweeps: 64,
    totalEventsHarvested: 21400,
  },
};

// Determine Persistent Storage File Paths
function getDiskFilePaths(): string[] {
  const paths: string[] = [];
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}
    }
    paths.push(path.join(dataDir, "users.json"));
  } catch {}

  try {
    const tmpDir = os.tmpdir();
    paths.push(path.join(tmpDir, "0ther5ide_users.json"));
  } catch {}

  return paths;
}

// Load users from disk into memory
function loadUsersFromDisk(): Record<string, UserProfile> {
  const loaded: Record<string, UserProfile> = { ...DEFAULT_USERS };
  const diskPaths = getDiskFilePaths();

  for (const filePath of diskPaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          Object.assign(loaded, parsed);
        }
      }
    } catch (err) {
      // Ignore read errors
    }
  }
  return loaded;
}

// Save users to disk
function saveUsersToDisk(users: Record<string, UserProfile>) {
  const diskPaths = getDiskFilePaths();
  const serialized = JSON.stringify(users, null, 2);

  for (const filePath of diskPaths) {
    try {
      const parent = path.dirname(filePath);
      if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent, { recursive: true });
      }
      fs.writeFileSync(filePath, serialized, "utf-8");
    } catch (err) {
      // Ignore write errors in restricted serverless environments
    }
  }
}

// Initialize on module load
try {
  const diskUsers = loadUsersFromDisk();
  Object.assign(memoryStore.users, diskUsers);
} catch {}

// Optional Upstash / Redis KV Adapter
async function kvGet<T>(key: string): Promise<T | null> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return data.result ? JSON.parse(data.result) : null;
      }
    } catch (err) {
      logger.warn("KV get failed, falling back to disk/memory store", { key }, err);
    }
  }
  return null;
}

async function kvSet(key: string, value: any): Promise<boolean> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/set/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${kvToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(JSON.stringify(value)),
      });
      return res.ok;
    } catch (err) {
      logger.warn("KV set failed, falling back to disk/memory store", { key }, err);
    }
  }
  return false;
}

export const db = {
  getUser: async (email: string): Promise<UserProfile | null> => {
    const cleanEmail = email.trim().toLowerCase();
    const remote = await kvGet<UserProfile>(`user:${cleanEmail}`);
    if (remote) {
      memoryStore.users[cleanEmail] = remote;
      return remote;
    }

    // Refresh from disk if not found in memory
    if (!memoryStore.users[cleanEmail]) {
      const diskUsers = loadUsersFromDisk();
      Object.assign(memoryStore.users, diskUsers);
    }

    return memoryStore.users[cleanEmail] || null;
  },

  upsertUser: async (profile: Partial<UserProfile> & { email: string }): Promise<UserProfile> => {
    const cleanEmail = profile.email.trim().toLowerCase();
    const existing = await db.getUser(cleanEmail);
    const now = new Date().toISOString();

    const updated: UserProfile = {
      id: existing?.id || "usr_" + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      name: profile.name || existing?.name || cleanEmail.split("@")[0].toUpperCase(),
      avatar: profile.avatar || existing?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      planTier: profile.planTier || existing?.planTier || "recon",
      stripeCustomerId: profile.stripeCustomerId || existing?.stripeCustomerId,
      subscriptionId: profile.subscriptionId || existing?.subscriptionId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    memoryStore.users[cleanEmail] = updated;
    saveUsersToDisk(memoryStore.users);
    await kvSet(`user:${cleanEmail}`, updated);
    await kvSet("users:all", Object.values(memoryStore.users));

    logger.info("User profile updated & persisted", { email: cleanEmail, tier: updated.planTier });
    return updated;
  },

  bulkUpsertUsers: async (userList: Array<Partial<UserProfile> & { email: string }>): Promise<UserProfile[]> => {
    const results: UserProfile[] = [];
    for (const u of userList) {
      if (u.email && u.email.includes("@")) {
        const updated = await db.upsertUser(u);
        results.push(updated);
      }
    }
    return results;
  },

  getAllUsers: async (): Promise<UserProfile[]> => {
    // 1. Check remote KV first
    const remoteList = await kvGet<UserProfile[]>("users:all");
    if (remoteList && Array.isArray(remoteList) && remoteList.length > 0) {
      for (const u of remoteList) {
        if (u.email) memoryStore.users[u.email.toLowerCase()] = u;
      }
    }

    // 2. Load from disk
    const diskUsers = loadUsersFromDisk();
    Object.assign(memoryStore.users, diskUsers);

    const list = Object.values(memoryStore.users);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  deleteUser: async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    if (memoryStore.users[cleanEmail]) {
      delete memoryStore.users[cleanEmail];
      saveUsersToDisk(memoryStore.users);
      await kvSet("users:all", Object.values(memoryStore.users));
      return true;
    }
    return false;
  },

  getSwarmLogs: async (): Promise<SwarmLog[]> => {
    const remote = await kvGet<SwarmLog[]>("swarm:logs");
    if (remote) return remote;
    return memoryStore.swarmLogs;
  },

  appendSwarmLogs: async (logs: SwarmLog[]) => {
    memoryStore.swarmLogs = [...logs, ...memoryStore.swarmLogs].slice(0, 100);
    memoryStore.metrics.totalSweeps += 1;
    memoryStore.metrics.totalEventsHarvested += logs.length * 5;
    await kvSet("swarm:logs", memoryStore.swarmLogs);
  },

  getMetrics: async () => {
    return memoryStore.metrics;
  },
};
