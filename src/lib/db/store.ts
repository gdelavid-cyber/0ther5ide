import { logger } from "@/lib/logger";
import type { SwarmLog, InsiderTrade } from "@/lib/types";

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

// In-memory memory store instance
const memoryStore: DatabaseSchema = {
  users: {
    "operator@0ther5ide.intel": {
      id: "usr_default_admin",
      email: "operator@0ther5ide.intel",
      name: "Operator Alpha",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      planTier: "vip",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  swarmLogs: [],
  trades: [],
  metrics: {
    totalSweeps: 64,
    totalEventsHarvested: 21400,
  },
};

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
      logger.warn("KV get failed, falling back to memory store", { key }, err);
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
      logger.warn("KV set failed, falling back to memory store", { key }, err);
    }
  }
  return false;
}

export const db = {
  getUser: async (email: string): Promise<UserProfile | null> => {
    const remote = await kvGet<UserProfile>(`user:${email}`);
    if (remote) return remote;
    return memoryStore.users[email] || null;
  },

  upsertUser: async (profile: Partial<UserProfile> & { email: string }): Promise<UserProfile> => {
    const existing = await db.getUser(profile.email);
    const now = new Date().toISOString();

    const updated: UserProfile = {
      id: existing?.id || "usr_" + Math.random().toString(36).substring(2, 9),
      email: profile.email,
      name: profile.name || existing?.name || "Operator",
      avatar: profile.avatar || existing?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      planTier: profile.planTier || existing?.planTier || "recon",
      stripeCustomerId: profile.stripeCustomerId || existing?.stripeCustomerId,
      subscriptionId: profile.subscriptionId || existing?.subscriptionId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    memoryStore.users[profile.email] = updated;
    await kvSet(`user:${profile.email}`, updated);
    logger.info("User profile updated", { email: profile.email, tier: updated.planTier });
    return updated;
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
