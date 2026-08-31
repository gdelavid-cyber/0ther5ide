export interface Signal {
  id: string;
  type: 'conflict' | 'economic' | 'geopolitical' | 'maritime' | 'aerial' | 'cyber' | 'market' | 'news' | 'satellite' | 'flight';
  title: string;
  country: string;
  lat: number;
  lng: number;
  severity: number;
  source: string;
  url: string;
  ts: string;
  markets?: MarketSignal[];
  tags: SignalTag[];
}

export interface MarketSignal {
  question: string;
  url: string;
  prob?: number;
}

export interface SignalTag {
  k: string;
  t: string;
}

export interface TensionIndex {
  score: number;
  level: 'SEVERE' | 'HIGH' | 'ELEVATED' | 'LOW';
  regions: RegionTension[];
}

export interface RegionTension {
  country: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
}

export interface InsiderTrade {
  id: string;
  person: string;
  company: string;
  ticker: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  value: number;
  filedAt: string;
  source: string;
  notable: boolean;
  cik: string;
  tags: SignalTag[];
}

export interface InsiderDossier {
  name: string;
  codename: string;
  cik: string;
  totalFilings: number;
  ytdVolume: number;
  ytdNet: number;
  topTickers: { ticker: string; value: number }[];
  firstSeen: string;
  lastActive: string;
  company: string;
  latest?: {
    side: 'buy' | 'sell';
    ticker: string;
    shares: number;
    price: number;
    value: number;
    action: string;
  };
  timeline: InsiderTrade[];
}

export interface IntelligenceData {
  meta: {
    sourcesQueried: number;
    sourcesOk: number;
    updated: string;
  };
  signals: Signal[];
  tension: TensionIndex;
  acled: { totalEvents: number };
  tg: { urgent: FeedItem[]; topPosts: FeedItem[] };
  feedList: Signal[];
}

export interface FeedItem {
  channel: string;
  text: string;
  date: string;
  isWho?: boolean;
  urgentFlags?: string[];
  views?: number;
  url?: string;
}

export interface GlobeMarker {
  lat: number;
  lng: number;
  severity: number;
  type: string;
  signal?: Signal;
}

export interface FlightTrack {
  icao: string;
  lat: number;
  lng: number;
  alt: number;
  heading: number;
  speed: number;
  callsign: string;
  type: string;
}

export interface FireHotspot {
  lat: number;
  lng: number;
  brightness: number;
  confidence: number;
  date: string;
  satellite: string;
}

export type PlanTier = 'recon' | 'vip';

export interface UserPlan {
  tier: PlanTier;
  analysesUsed: number;
  analysesLimit: number;
  chatsUsed: number;
  chatsLimit: number;
  memberSince: string;
}

export interface OptionFlowItem {
  id: string;
  ticker: string;
  type: 'SWEEP' | 'BLOCK' | 'GOLDEN_SWEEP';
  strike: number;
  expiry: string;
  sentiment: 'BULLISH' | 'BEARISH';
  contractType: 'CALL' | 'PUT';
  premium: number;
  size: number;
  spotPrice: number;
  volume: number;
  openInterest: number;
  volOiRatio: number;
  timestamp: string;
  venue: string;
  isUnusual: boolean;
}

export interface DarkPoolPrint {
  id: string;
  ticker: string;
  price: number;
  size: number;
  premium: number;
  exchange: string;
  timestamp: string;
  side: 'ABOVE_ASK' | 'BELOW_BID' | 'MID';
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  delta: number;
  isImbalance?: boolean;
}

export interface OrderBookLadder {
  ticker: string;
  currentPrice: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  bidDepthTotal: number;
  askDepthTotal: number;
  imbalanceRatio: number;
}

export interface FlowDecomposition {
  ticker: string;
  institutionalDominance: number; // 0 - 100%
  institutionalNetDelta: number;
  retailShare: number;
  hftShare: number;
  darkPoolVolumeRatio: number; // % of daily vol off-exchange
  gammaExposureGEX: 'POSITIVE_GAMMA' | 'NEGATIVE_GAMMA';
  verdict: 'STRONG_INSTITUTIONAL_ACCUMULATION' | 'INSTITUTIONAL_DISTRIBUTION' | 'RETAIL_CHURN' | 'BALANCED';
}

export interface OrderFlowData {
  optionsFlow: OptionFlowItem[];
  darkPoolPrints: DarkPoolPrint[];
  orderBook: OrderBookLadder;
  decomposition: FlowDecomposition;
  summary: {
    totalSweepVolume: number;
    bullishFlowPercent: number;
    darkPoolTotalValue: number;
    topActiveTickers: string[];
    updatedAt: string;
  };
}
export * from "./swarm/types";
