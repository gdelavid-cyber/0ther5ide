export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { getSwarmState, executeSwarmSweep } from "@/lib/swarm";

export async function GET() {
  try {
    const state = getSwarmState();
    return Response.json(state);
  } catch (err) {
    return Response.json({ error: "Swarm query failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let targetQuery = "";
    try {
      const body = await req.json();
      targetQuery = body.targetQuery || "";
    } catch {}
    const state = await executeSwarmSweep(targetQuery);
    return Response.json(state);
  } catch (err) {
    return Response.json({ error: "Swarm mission execution failed" }, { status: 500 });
  }
}
