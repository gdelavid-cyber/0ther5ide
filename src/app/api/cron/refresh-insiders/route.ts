export const dynamic = "force-dynamic";
import { fetchSECInsiders } from '@/lib/feeds/sec';

export async function GET() {
  try {
    const filings = await fetchSECInsiders();
    return Response.json({ refreshed: true, count: filings.length });
  } catch {
    return Response.json({ refreshed: false }, { status: 500 });
  }
}