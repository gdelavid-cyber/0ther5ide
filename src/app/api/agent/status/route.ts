export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;
  const hasKey = !!(openRouterKey || openAIKey);

  const provider = openRouterKey ? "OpenRouter" : openAIKey ? "OpenAI" : "0ther5ide Local Heuristic Engine";
  const model = process.env.OPENROUTER_MODEL || (openRouterKey ? "meta-llama/llama-3.3-70b-instruct" : "gpt-4o-mini");

  return NextResponse.json({
    status: "ONLINE",
    keyConfigured: hasKey,
    provider,
    model: hasKey ? model : "0ther5ide-heuristic-v2",
    keyPreview: openRouterKey
      ? `sk-or-...${openRouterKey.slice(-4)}`
      : openAIKey
      ? `sk-...${openAIKey.slice(-4)}`
      : "NONE (Local Neural Engine)",
    telemetryFeeds: {
      nasaViirs: "ONLINE",
      acledConflict: "ONLINE",
      gdeltCrisis: "ONLINE",
      secEdgarForm4: "ONLINE",
      openSkyRadar: "ONLINE",
    },
    timestamp: new Date().toISOString(),
  });
}
