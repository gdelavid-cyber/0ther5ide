import { aggregateIntel } from '@/lib/feeds/aggregate';

export async function GET() {
  try {
    const data = await aggregateIntel();
    return Response.json({ refreshed: true, updated: data.meta.updated });
  } catch {
    return Response.json({ refreshed: false }, { status: 500 });
  }
}