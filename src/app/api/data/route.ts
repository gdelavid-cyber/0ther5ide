import { aggregateIntel } from '@/lib/feeds/aggregate';
import { fetchSECInsiders } from '@/lib/feeds/sec';
import { fetchCrypto } from '@/lib/feeds/markets';
import { fetchOpenSky } from '@/lib/feeds/opensky';
import { fetchFIRMS } from '@/lib/feeds/firms';

export async function GET() {
  try {
    const [intel, insiders, cryptos, flights, fires] = await Promise.all([
      aggregateIntel(),
      fetchSECInsiders().catch(() => []),
      fetchCrypto(),
      fetchOpenSky().catch(() => []),
      fetchFIRMS().catch(() => []),
    ]);

    return Response.json({
      ...intel,
      insiders: insiders.length,
      markets: {
        crypto: cryptos.slice(0, 10),
        feed: [],
      },
      acled: { totalEvents: intel.acled.totalEvents },
      flights: flights.length,
      fires: fires.length,
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to aggregate intel data' },
      { status: 500 }
    );
  }
}