"use client";

import { useState, useEffect, useRef } from "react";
import WalletModal, { type ConnectedWallet } from "./WalletModal";

interface Props {
  onWalletChange?: (wallet: ConnectedWallet | null) => void;
}

export default function WalletButton({ onWalletChange }: Props) {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved wallet on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("0ther5ide_connected_wallet");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.address) {
          setWallet(parsed);
          onWalletChange?.(parsed);
        }
      }
    } catch {}
  }, [onWalletChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnect = (newWallet: ConnectedWallet) => {
    setWallet(newWallet);
    onWalletChange?.(newWallet);
  };

  const handleDisconnect = () => {
    try {
      localStorage.removeItem("0ther5ide_connected_wallet");
    } catch {}
    setWallet(null);
    onWalletChange?.(null);
    setDropdownOpen(false);
  };

  const copyAddress = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return addr.slice(0, 5) + "..." + addr.slice(-4);
  };

  return (
    <div className="relative font-mono" ref={dropdownRef}>
      {wallet ? (
        /* Connected Wallet Pill */
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface/90 border border-accent/60 hover:border-accent text-fg text-xs transition shadow-sm font-bold active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          <span className="text-[10px] text-accent">{wallet.chain}</span>
          <span className="text-muted">·</span>
          <span className="text-fg">{formatAddress(wallet.address)}</span>
          <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.2 rounded font-bold">
            {wallet.balance}
          </span>
          <span className="text-[9px] text-muted">▼</span>
        </button>
      ) : (
        /* Connect Wallet Trigger Button */
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-accent/20 via-emerald-400/20 to-teal-500/20 border border-accent/60 hover:border-accent text-accent text-xs font-bold transition shadow-sm hover:brightness-110 active:scale-95"
        >
          <span>🔗</span>
          <span>CONNECT WALLET</span>
        </button>
      )}

      {/* Connected Wallet Dropdown Menu */}
      {dropdownOpen && wallet && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-[#080d14] border border-accent/50 rounded-xl shadow-2xl p-3 space-y-2.5 text-xs text-fg animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div>
              <div className="text-[9px] text-muted uppercase">Connected Web3 Wallet</div>
              <div className="font-bold text-accent text-xs mt-0.5">{wallet.type.toUpperCase()} ({wallet.chain})</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-accent signal-pulse" />
          </div>

          {/* Full Address / Copy */}
          <div className="p-2 rounded-lg bg-surface/60 border border-border/40 space-y-1">
            <div className="text-[8.5px] text-muted uppercase">Public Address</div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-fg font-mono truncate">{wallet.address}</span>
              <button
                onClick={copyAddress}
                className="px-1.5 py-0.5 rounded bg-bg text-[9px] text-accent border border-border/60 hover:border-accent transition font-bold"
              >
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>

          {/* Balance & Network */}
          <div className="flex items-center justify-between text-[10px] px-1 text-muted">
            <span>Portfolio Liquidity:</span>
            <span className="font-bold text-fg">{wallet.balance}</span>
          </div>

          {/* Disconnect Action */}
          <button
            onClick={handleDisconnect}
            className="w-full py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-300 text-[10px] font-bold transition uppercase tracking-wider text-center"
          >
            Disconnect Wallet
          </button>
        </div>
      )}

      {/* Wallet Selection Modal */}
      <WalletModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConnect={handleConnect}
      />
    </div>
  );
}
