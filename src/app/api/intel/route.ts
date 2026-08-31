export const dynamic = "force-dynamic";
import { aggregateIntel } from '@/lib/feeds/aggregate';

export async function GET() {
  try {
    const data = await aggregateIntel();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: 'Failed to fetch intel' },
      { status: 500 }
    );
  }
}