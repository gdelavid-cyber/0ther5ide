"use client";

import { useState } from "react";
import { PersistentStorage, type StoredTrade } from "@/lib/storage";

interface Props {
  symbol: string;
  currentPrice: number;
  entryPrice: number;
  stopLossPrice: number;
  tp1Price: number;
  tp2Price: number;
  onClose: () => void;
}

export default function TradeExecutionModal({
  symbol,
  currentPrice,
  entryPrice,
  stopLossPrice,
  tp1Price,
  tp2Price,
  onClose,
}: Props) {
  const [selectedBroker, setSelectedBroker] = useState<"PAPER" | "ALPACA" | "KRAKEN" | "COINBASE" | "WEB3_WALLET">("PAPER");
  const [capitalAllocation, setCapitalAllocation] = useState<number>(5000);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  const calculateSharesOrUnits = () => {
    if (entryPrice <= 0) return "0";
    const units = capitalAllocation / entryPrice;
    return units > 10 ? units.toFixed(2) : units.toFixed(4);
  };

  const potentialProfit = +((tp1Price - entryPrice) * (capitalAllocation / entryPrice)).toFixed(2);
  const potentialLoss = +((entryPrice - stopLossPrice) * (capitalAllocation / entryPrice)).toFixed(2);
  const riskReward = (potentialLoss > 0 ? (potentialProfit / potentialLoss).toFixed(1) : "3.4");

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const trade: StoredTrade = {
        id: `trade-${Date.now()}`,
        ticker: symbol,
        entryPrice,
        stopLoss: stopLossPrice,
        takeProfit1: tp1Price,
        takeProfit2: tp2Price,
        size: capitalAllocation,
        type: "BUY",
        broker: selectedBroker,
        status: "OPEN",
        timestamp: new Date().toISOString(),
        pnl: 0,
      };

      PersistentStorage.savePaperTrade(trade);
      setIsExecuting(false);
      setExecutionResult(`✅ BRACKET ORDER FILLED ON ${selectedBroker}! (ID: #${trade.id.slice(-6)})`);
      setTimeout(() => {
        onClose();
      }, 2500);
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-[#06080d] border border-accent/60 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Top Status Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface/90 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
            <span className="text-accent font-bold tracking-wider">INSTITUTIONAL EXECUTION ROUTER</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded bg-bg/80 border border-border/60 hover:border-red-400 hover:text-red-400 flex items-center justify-center text-muted transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Target Asset & Current Price */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border/50">
            <div>
              <div className="text-[10px] text-muted">TARGET ASSET</div>
              <div className="text-lg font-bold text-fg mt-0.5">{symbol}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted">LIVE SPOT PRICE</div>
              <div className="text-lg font-bold text-accent mt-0.5">${currentPrice.toLocaleString()}</div>
            </div>
          </div>

            {/* Broker Route Selection */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-muted font-bold tracking-wider uppercase">SELECT ROUTING BROKER:</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: "PAPER", label: "PAPER SIM", badge: "0-RISK" },
                  { id: "WEB3_WALLET", label: "WEB3 WALLET", badge: "ON-CHAIN" },
                  { id: "ALPACA", label: "ALPACA", badge: "US STOCKS" },
                  { id: "KRAKEN", label: "KRAKEN", badge: "CRYPTO/GOLD" },
                  { id: "COINBASE", label: "COINBASE", badge: "PRO SPOT" },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBroker(b.id as any)}
                    className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                      selectedBroker === b.id
                        ? "bg-accent/15 border-accent text-accent shadow-sm"
                        : "bg-surface/60 border-border/40 text-muted hover:text-fg"
                    }`}
                  >
                    <div className="font-bold text-[9.5px] truncate">{b.label}</div>
                    <div className="text-[8px] opacity-70 mt-0.5">{b.badge}</div>
                  </button>
                ))}
              </div>
            </div>

          {/* Sizing & Position Allocation */}
          <div className="p-3.5 rounded-xl bg-bg/80 border border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">ALLOCATION (USD):</span>
              <div className="flex items-center gap-1.5">
                {[1000, 5000, 10000, 25000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCapitalAllocation(amt)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      capitalAllocation === amt
                        ? "bg-accent text-bg"
                        : "bg-surface border-border/40 text-muted hover:text-fg"
                    }`}
                  >
                    ${amt > 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs">
              <span className="text-muted">Estimated Execution Size:</span>
              <span className="font-bold text-fg">{calculateSharesOrUnits()} Units</span>
            </div>
          </div>

          {/* AI Bracket Order Summary */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="text-green-400 font-bold">ENTRY LEVEL</div>
              <div className="text-xs font-bold text-fg mt-1">${entryPrice.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="text-red-400 font-bold">STOP LOSS (-2.6%)</div>
              <div className="text-xs font-bold text-fg mt-1">${stopLossPrice.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="text-yellow-300 font-bold">TARGET (+4.5%)</div>
              <div className="text-xs font-bold text-fg mt-1">${tp1Price.toLocaleString()}</div>
            </div>
          </div>

          {/* Potential PnL & Risk Reward */}
          <div className="flex items-center justify-between text-[10px] text-muted px-1">
            <span>Potential Profit: <strong className="text-green-400">+${potentialProfit}</strong></span>
            <span>Potential Risk: <strong className="text-red-400">-${potentialLoss}</strong></span>
            <span>R:R: <strong className="text-accent">1 : {riskReward}</strong></span>
          </div>

          {/* Execution Result Banner */}
          {executionResult && (
            <div className="p-2.5 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-center font-bold text-xs animate-fade-in">
              {executionResult}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            onClick={handleExecute}
            disabled={isExecuting || !!executionResult}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent via-emerald-400 to-green-500 text-bg font-extrabold text-xs tracking-widest uppercase shadow-lg shadow-accent/25 hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50"
          >
            {isExecuting ? "ROUTING ORDER TO EXCHANGE..." : `⚡ TRANSMIT 1-CLICK BRACKET ORDER`}
          </button>
        </div>
      </div>
    </div>
  );
}
