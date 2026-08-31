/**
 * HYBRID CLIENT & CLOUD PERSISTENT STORAGE LAYER
 * Provides seamless local storage persistence with zero external DB failure risk.
 */

export interface StoredTrade {
  id: string;
  ticker: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  size: number;
  type: "BUY" | "SELL";
  broker: "PAPER" | "ALPACA" | "KRAKEN" | "COINBASE";
  status: "OPEN" | "CLOSED" | "CANCELLED";
  timestamp: string;
  pnl?: number;
}

export interface StoredChatMessage {
  role: "user" | "bot";
  content: string;
  model?: string;
  timestamp: string;
}

const STORAGE_KEYS = {
  CHAT_HISTORY: "0ther5ide_chat_history_v2",
  PAPER_PORTFOLIO: "0ther5ide_paper_portfolio_v2",
  WATCHLIST: "0ther5ide_watchlist_v2",
  USER_SETTINGS: "0ther5ide_settings_v2",
};

export class PersistentStorage {
  private static isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  // --- Chat History ---
  public static getChatHistory(): StoredChatMessage[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static saveChatHistory(messages: StoredChatMessage[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages.slice(-50)));
    } catch {}
  }

  public static clearChatHistory(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    } catch {}
  }

  // --- Paper Trading Portfolio ---
  public static getPaperTrades(): StoredTrade[] {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAPER_PORTFOLIO);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static savePaperTrade(trade: StoredTrade): void {
    if (!this.isBrowser()) return;
    try {
      const existing = this.getPaperTrades();
      const updated = [trade, ...existing];
      localStorage.setItem(STORAGE_KEYS.PAPER_PORTFOLIO, JSON.stringify(updated.slice(0, 100)));
    } catch {}
  }

  // --- Watchlist ---
  public static getWatchlist(): string[] {
    if (!this.isBrowser()) return ["NVDA", "BTC", "XAUUSD", "TSLA", "SPY", "ETH", "SOL"];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
      return data ? JSON.parse(data) : ["NVDA", "BTC", "XAUUSD", "TSLA", "SPY", "ETH", "SOL"];
    } catch {
      return ["NVDA", "BTC", "XAUUSD", "TSLA", "SPY", "ETH", "SOL"];
    }
  }

  public static saveWatchlist(tickers: string[]): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(tickers));
    } catch {}
  }
}
