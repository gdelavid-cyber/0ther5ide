interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
}

interface StockData {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
}

const FALLBACK_CRYPTO: CryptoData[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 64250, market_cap: 1260000000000, price_change_percentage_24h: 3.4 },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3480, market_cap: 418000000000, price_change_percentage_24h: -5.8 },
  { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 154.2, market_cap: 72000000000, price_change_percentage_24h: 8.6 },
  { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1.0, market_cap: 118000000000, price_change_percentage_24h: 0.01 },
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 575, market_cap: 88000000000, price_change_percentage_24h: 2.1 },
];

export async function fetchCrypto() {
  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1';
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) return FALLBACK_CRYPTO;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_CRYPTO;
  } catch {
    return FALLBACK_CRYPTO;
  }
}

export function cryptoToSignals(cryptos: CryptoData[]) {
  return cryptos.filter(c => Math.abs(c.price_change_percentage_24h) > 5).map(c => ({
    id: `crypto-${c.id}`,
    type: 'market' as const,
    title: `${c.name} (${c.symbol.toUpperCase()}) ${c.price_change_percentage_24h > 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(1)}%`,
    country: 'Global',
    lat: 0,
    lng: 0,
    severity: Math.abs(c.price_change_percentage_24h) > 15 ? 3 : Math.abs(c.price_change_percentage_24h) > 8 ? 2 : 1,
    source: 'CoinGecko',
    url: `https://coingecko.com/en/coins/${c.id}`,
    ts: new Date().toISOString(),
    tags: [{ k: 'asset', t: 'crypto' }, { k: 'symbol', t: c.symbol }],
  }));
}

export async function fetchStocks(tickers: string[] = ['NVDA', 'AAPL', 'TSLA', 'AMZN', 'META']) {
  try {
    const symbols = tickers.join(',');
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbols}?interval=1d&range=1d`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return parseStocks(data);
  } catch {
    return [];
  }
}

function parseStocks(data: any) {
  const results = data.chart?.result || [];
  return results.map((r: any) => ({
    symbol: r.meta?.symbol || '',
    shortName: r.meta?.shortName || '',
    regularMarketPrice: r.indicators?.quote?.[0]?.close?.[0] || 0,
    regularMarketChange: r.indicators?.quote?.[0]?.close?.[0] ? r.indicators?.quote?.[0]?.close?.[0] - r.indicators?.quote?.[0]?.open?.[0] : 0,
    regularMarketChangePercent: 0,
  }));
}