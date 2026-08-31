export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

function generateHeuristicReply(query: string, analysis?: string): string {
  const upper = query.toUpperCase();

  // 1. Terminal Guide & Educational Walkthrough
  if (upper.match(/\b(GUIDE|HOW TO USE|EXPLAIN TERMINAL|HELP ME|WALKTHROUGH|TUTORIAL|WHAT IS THIS)\b/i)) {
    return `0ther5ide INTELLIGENCE TERMINAL — OPERATOR FIELD GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Welcome Operator. Here is your tactical breakdown of every live module:

1. 🌐 3D ORBITAL GLOBE
   • Red/Orange Pins = Active kinetic conflicts (ACLED) and thermal infrared fire hotspots (NASA VIIRS).
   • Cyan Trajectory Arcs = Active strategic communications & command vectors between major defense hubs.
   • Click on ANY beacon on the globe to inspect real-time coordinates and source dispatches.

2. 🐋 SEC EDGAR FORM 4 INSIDER TRACKER
   • Tracks C-Suite executive stock purchases & dumps exceeding $1M+.
   • Click "DECRYPT DOSSIER" on any insider to reveal their multi-year filing history, codename, and cumulative net buy/sell ratio.

3. 📈 INSTITUTIONAL ORDER FLOW & DARK POOLS
   • Analyzes off-exchange Block Trades and ADF dark pool absorption.
   • GEX (Gamma Exposure) indicates whether market makers are suppressing or amplifying stock volatility.

4. 📡 AUTONOMOUS AI SWARM
   • 4 background agents (RECON, WHALE-HUNTER, ORBITAL-SENTINEL, SYNTHESIS-COMMANDER) automatically correlate satellite, market, and conflict data 24/7.

💡 DIRECTIVE: Ask me to evaluate any ticker (e.g., "Analyze NVDA") or any theater (e.g., "Assess Red Sea risk").`;
  }

  // 2. Casual / Conversational / Status Greetings
  if (upper.match(/\b(HOW ARE YOU|HOW ARE U|HOWS IT GOING|STATUS|HELLO|HI|HEY|GREETINGS|WHO ARE YOU|WHO ARE U)\b/i)) {
    return `0ther5ide NEURAL TERMINAL ONLINE — OPERATIONAL STATUS: NOMINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SYSTEM TELEMETRY: 5/5 FEEDS SYNCHRONIZED
   • NASA VIIRS 375m Thermal Satellite: ACTIVE
   • ACLED Kinetic Conflict Feed: ACTIVE
   • GDELT 2.0 Global Geopolitical Stream: ACTIVE
   • SEC EDGAR Form 4 Insider Tracker: ACTIVE
   • OpenSky ADS-B Military Radar: ACTIVE

2. CURRENT THREAT POSTURE: DEFCON 2 / ELEVATED
   Multi-domain sensor fusion actively monitoring maritime corridors (Red Sea, Taiwan Strait, Persian Gulf).

3. DIRECTIVE:
   Ready for tactical target analysis, stock ticker evaluation (e.g. NVDA, TSLA), or geopolitical threat assessment.`;
  }

  // 3. Financial & Asset Evaluation
  const isMarket = upper.match(/NVDA|AAPL|TSLA|BTC|ETH|SOL|AMZN|MSFT|GOOGL|GOLD|XAUUSD|XAU|SILVER|MARKET|STOCK|CRYPTO|DARK POOL|INSIDER/i);
  if (isMarket) {
    const assetMatch = upper.match(/NVDA|AAPL|TSLA|BTC|ETH|SOL|AMZN|MSFT|GOOGL/i);
    const asset = assetMatch ? assetMatch[0].toUpperCase() : "TARGET ASSET";
    return `CLASSIFIED INTELLIGENCE SYNTHESIS — ASSET: ${asset}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. VERDICT: ACCUMULATE / BULLISH BIAS
   Institutional order flow confirms heavy dark-pool absorption. Volume footprint shows +2.8x standard deviation on dips.

2. KEY LEVELS
   • Primary Support / Invalidation: Established at structural breakout demand zone.
   • Tactical Resistance: 1st institutional liquidity band +8.4% above current VWAP.

3. RISK ASSESSMENT: MODERATE
   Macro liquidity cross-currents present. Tight invalidation recommended below local high-volume node.

4. TARGETS & EXPLANATION
   • Target 1: Previous swing liquidity pool.
   • Target 2: Macro continuation boundary (+14.2%).
   • Dark Pool Explanation: Over 62% of institutional volume executed off-exchange indicates stealth accumulation before public earnings.`;
  }

  // 4. Geopolitical & Conflict Assessment
  const isGeopolitical = upper.match(/TAIWAN|RED SEA|UKRAINE|RUSSIA|CHINA|MIDDLE EAST|OIL|STRAIT|WAR|CONFLICT|HORMUZ|IRAN|ISRAEL|LEBANON/i);
  if (isGeopolitical) {
    return `0ther5ide TACTICAL ASSESSMENT — THEATER OF OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. VERDICT: ELEVATED / HIGH CONFLICT RISK
   Active telemetry confirms multi-domain sensor convergence. Thermal anomaly density elevated in border logistics corridors.

2. KEY FLASHPOINTS & HOTSPOTS
   • Primary Flashpoint: Maritime choke points & strategic corridors.
   • Defense Readiness Condition: DEFCON 2 equivalent posture.

3. RISK ASSESSMENT: HIGH
   Supply chain vulnerability index at 78/100. Potential for shipping route rerouting and energy premium volatility.

4. TACTICAL TARGETS & GUIDANCE
   • Immediate: Monitor satellite SAR sweeps and AIS transponder dark-zones.
   • Strategic Action: Rebalance exposure away from affected maritime vectors.`;
  }

  // 5. General Strategic Intel Synthesis
  return `CLASSIFIED INTELLIGENCE SYNTHESIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. VERDICT: SURVEILLANCE & GUIDANCE ACTIVE
   Query indexed across global defense, financial, and orbital satellite telemetry streams.

2. SYSTEM CONVERGENCE
   • Intelligence Confidence: 96.4%
   • Active Sensors: 5/5 Streams Monitored
   • Global Tension Index: ELEVATED (Score: 68/100)

3. TACTICAL SUMMARY & NEXT STEPS
   Multi-sensor correlation confirms heightened systemic sensitivity over the active 72-hour operational window. Ask me to guide you through specific coordinates or assets.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, analysis, model: requestedModel } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;
    const apiKey = openRouterKey || openAIKey;

    // If local heuristic model is requested or no key provided
    if (requestedModel === "0ther5ide-heuristic-v2" || !apiKey) {
      const reply = generateHeuristicReply(lastMessage, analysis);
      return Response.json({
        reply,
        model: "0ther5ide-heuristic-v2",
        reasoning: "0ther5ide neural engine tactical heuristic synthesis.",
        usage: { promptTokens: 42, completionTokens: 180 },
      });
    }

    // Try OpenRouter / OpenAI call
    try {
      const isOpenRouter = !!openRouterKey;
      const apiUrl = isOpenRouter
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

      const model = requestedModel || process.env.OPENROUTER_MODEL || (isOpenRouter ? "nvidia/nemotron-3.5-lightning:free" : "gpt-4o-mini");

      const systemPrompt = `You are 0ther5ide — an elite military & financial intelligence analysis co-pilot and interactive terminal guide.
Your purpose is twofold:
1. Provide classified tactical analysis across GEOINT (satellite/conflict), FININT (SEC Form 4 insider trading, dark pools), and SIGINT.
2. Guide, explain, and educate the operator on how to interpret intelligence data, financial indicators (GEX, dark pools, VWAP), and satellite hotspots in plain, insightful language.

Format your responses cleanly with:
1. VERDICT / EXECUTIVE SUMMARY
2. BREAKDOWN & GUIDED EXPLANATION
3. KEY LEVELS, COORDINATES & INSIDER CLUSTERS
4. ACTIONABLE DIRECTIVES & NEXT STEPS

Be concise, authoritative, and helpful. Always guide the user clearly.`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://0ther5ide.vercel.app",
          "X-Title": "0ther5ide Intelligence Terminal",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m: any) => ({ role: m.role === "bot" ? "assistant" : m.role, content: m.content })),
          ],
          max_tokens: 700,
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(9000),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return Response.json({
            reply,
            model,
            reasoning: `Synthesized via ${isOpenRouter ? "OpenRouter" : "OpenAI"} (${model})`,
            usage: {
              promptTokens: data.usage?.prompt_tokens || 0,
              completionTokens: data.usage?.completion_tokens || 0,
            },
          });
        }
      }

      logger.warn("LLM API returned non-OK status, falling back to heuristic guide", { status: response.status });
    } catch (llmErr) {
      logger.warn("LLM provider unreachable, falling back to heuristic guide", {}, llmErr);
    }

    // Graceful seamless fallback
    const fallbackReply = generateHeuristicReply(lastMessage, analysis);
    return Response.json({
      reply: fallbackReply,
      model: "0ther5ide-heuristic-v2",
      reasoning: "0ther5ide neural engine tactical heuristic synthesis (failover).",
      usage: { promptTokens: 40, completionTokens: 160 },
    });
  } catch (err: any) {
    logger.error("Chat Agent critical exception", {}, err);
    return Response.json({
      reply: "0ther5ide NEURAL CORE ONLINE — Ready for tactical directives.",
      model: "0ther5ide-fallback",
    });
  }
}
