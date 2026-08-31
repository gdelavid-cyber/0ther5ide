import { NextRequest } from "next/server";
import { getSwarmState } from "@/lib/swarm";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Immediately emit current state
      try {
        const initial = getSwarmState();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));
      } catch (err) {
        logger.error("SSE stream initial emit failed", {}, err);
      }

      // 2. Periodic shared broadcast without duplicate sweeping
      const interval = setInterval(() => {
        try {
          const state = getSwarmState();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
        }
      }, 3500);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
