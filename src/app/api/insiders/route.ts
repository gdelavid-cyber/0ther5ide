import { fetchSECInsiders } from '@/lib/feeds/sec';
import type { InsiderTrade } from '@/lib/types';

export async function GET() {
  try {
    const filings = await fetchSECInsiders();
    const trades: InsiderTrade[] = filings.slice(0, 50).map((f, i) => ({
      id: `sec-${i}`,
      person: f.name || 'Unknown',
      company: f.ticker || '',
      ticker: f.ticker || '',
      action: f.action === 'buy' ? 'buy' : 'sell',
      shares: f.shares || 0,
      price: f.value ? f.value / (f.shares || 1) : 0,
      value: f.value || 0,
      filedAt: f.filingDate || new Date().toISOString(),
      source: 'SEC EDGAR',
      notable: false,
      cik: f.cik || '',
      tags: [{ k: 'source', t: 'SEC EDGAR' }],
    }));

    trades.sort((a, b) => {
      if (a.action === 'buy' && b.action !== 'buy') return -1;
      if (a.action !== 'buy' && b.action === 'buy') return 1;
      return b.value - a.value;
    });

    return Response.json({
      trades,
      updated: new Date().toISOString(),
      hasMore: trades.length >= 50,
    });
  } catch (err) {
    return Response.json(
      { error: 'Failed to fetch insider filings' },
      { status: 500 }
    );
  }
}