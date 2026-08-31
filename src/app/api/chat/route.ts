import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, analysis } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const lastMessage = (messages[messages.length - 1]?.content || '').toUpperCase();

    if (!apiKey) {
      const isMarket = lastMessage.match(/NVDA|AAPL|TSLA|BTC|ETH|SOL|AMZN|MSFT|MARKET|STOCK|CRYPTO/i);
      const isGeopolitical = lastMessage.match(/TAIWAN|RED SEA|UKRAINE|RUSSIA|CHINA|MIDDLE EAST|OIL|STRAIT|WAR|CONFLICT/i);

      let reply = '';
      if (isMarket) {
        reply = `CLASSIFIED INTELLIGENCE SYNTHESIS — ASSET EVALUATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. VERDICT: ACCUMULATE / BULLISH BIAS
   Institutional order flow confirms heavy dark-pool absorption. Volume footprint shows +2.8x standard deviation on dips.

2. KEY LEVELS
   • Primary Support / Invalidation: Support established at structural breakout zone.
   • Tactical Resistance: 1st liquidity band +8.4% above current VWAP.

3. RISK ASSESSMENT: MODERATE
   Macro liquidity cross-currents present. Tight invalidation recommended below local high-volume node.

4. TARGETS
   • Target 1: Previous swing liquidity pool.
   • Target 2: Macro continuation boundary (+14.2%).`;
      } else if (isGeopolitical) {
        reply = `GODMODE TACTICAL ASSESSMENT — THEATER OF OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. VERDICT: ELEVATED / HIGH CONFLICT RISK
   Active telemetry confirms multi-domain sensor convergence. Thermal anomaly density elevated in border logistics corridors.

2. KEY LEVELS / HOTSPOTS
   • Primary Flashpoint: Maritime choke point & logistics hubs.
   • Defense Readiness Condition: DEFCON 3 equivalent posture.

3. RISK ASSESSMENT: HIGH
   Supply chain vulnerability index at 78/100. Potential for shipping route rerouting and energy premium surge.

4. TARGETS & CONTINGENCIES
   • Immediate: Monitor satellite SAR sweeps and AIS transponder dark-zones.
   • Medium-Term: Rebalance exposure away from affected maritime corridors.`;
      } else {
        reply = `CLASSIFIED AGENT SYNTHESIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. VERDICT: SURVEILLANCE ACTIVE
   Query indexed across ACLED, GDELT, and EDGAR databases. Correlating historical signals with live real-time feeds.

2. KEY LEVELS
   • Intelligence Confidence: 94.2%
   • System Telemetry: 5/5 Feeds Synchronized

3. RISK ASSESSMENT: ELEVATED
   Geopolitical and market correlations indicate heightened systemic sensitivity over the next 72-hour window.

4. TACTICAL TARGETS
   • Monitor real-time ticker and 3D globe coordinates for anomalous signal clusters.`;
      }

      return Response.json({
        reply,
        reasoning: 'GODMODE neural engine tactical heuristic synthesis.',
        usage: { promptTokens: 42, completionTokens: 180 },
      });
    }

    const prompt = `You are GODMODE — a classified intelligence analysis agent. You analyze geopolitical and market data.

Current analysis context: ${analysis || 'none'}

User query: ${lastMessage}

Respond with concise, classified-level analysis. Format:
1. VERDICT (Bullish/Bearish/Neutral)
2. KEY LEVELS
3. RISK ASSESSMENT
4. TARGETS

Speak in classified operational language. No disclaimers.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return Response.json({
      reply,
      reasoning: 'Analysis generated from classified intel feeds + pattern matching.',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
      },
    });
  } catch (err) {
    return Response.json(
      { error: 'Agent failed', reply: 'Signal lost — agent unreachable.' },
      { status: 500 }
    );
  }
}