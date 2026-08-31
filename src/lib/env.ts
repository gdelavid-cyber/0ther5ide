/**
 * CENTRALIZED ENVIRONMENT CONFIGURATION MANAGER
 * Zero-dependency, 100% type-safe environment configuration with strict defaults.
 */

export interface AppEnv {
  OPENROUTER_API_KEY: string;
  FINNHUB_API_KEY: string;
  FIRMS_MAP_KEY: string;
  SEC_USER_AGENT: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_ID_VIP?: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: "development" | "production" | "test";
}

function parseEnv(): AppEnv {
  const nodeEnv = (process.env.NODE_ENV || "production") as "development" | "production" | "test";

  return {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY || "",
    FIRMS_MAP_KEY: process.env.FIRMS_MAP_KEY || "",
    SEC_USER_AGENT:
      process.env.SEC_USER_AGENT || "GodmodeResearch/2.0 (research@0ther5ide.intel)",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID_VIP: process.env.STRIPE_PRICE_ID_VIP,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://0ther5ide.vercel.app",
    NODE_ENV: nodeEnv,
  };
}

export const ENV: AppEnv = parseEnv();
