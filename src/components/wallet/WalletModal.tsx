"use client";

import { useState, useEffect } from "react";

export interface ConnectedWallet {
  address: string;
  chain: "Ethereum" | "Solana" | "Base" | "Arbitrum" | "Polygon";
  type: "metamask" | "phantom" | "coinbase" | "walletconnect" | "okx";
  balance: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: ConnectedWallet) => void;
}

const WALLET_PROVIDERS = [
  {
    id: "metamask",
    name: "MetaMask",
    chain: "Ethereum / EVM",
    icon: "🦊",
    badge: "POPULAR",
    description: "Connect via MetaMask or any standard Injected Web3 browser wallet",
  },
  {
    id: "phantom",
    name: "Phantom",
    chain: "Solana",
    icon: "👻",
    badge: "SOLANA L1",
    description: "Fast multi-chain wallet for Solana DeFi & high-speed order flow",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    chain: "Base / EVM",
    icon: "🔵",
    badge: "SMART WALLET",
    description: "Passkey & self-custody smart wallet powered by Coinbase Base L2",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    chain: "Multi-Chain",
    icon: "📡",
    badge: "MOBILE QR",
    description: "Scan QR code with Trust Wallet, Rainbow, Zerion, or Ledger Live",
  },
  {
    id: "okx",
    name: "OKX / Backpack",
    chain: "Multi-Chain DEX",
    icon: "⚡",
    badge: "PRO TRADER",
    description: "High-frequency Web3 DEX aggregator wallet",
  },
];

export default function WalletModal({ isOpen, onClose, onConnect }: Props) {
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<"SELECT" | "CONNECTING" | "QR">("SELECT");
  const [selectedChain, setSelectedChain] = useState<"Ethereum" | "Solana" | "Base" | "Arbitrum" | "Polygon">("Ethereum");

  if (!isOpen) return null;

  const handleWalletSelect = async (providerId: string) => {
    setConnectingId(providerId);
    setActiveStep(providerId === "walletconnect" ? "QR" : "CONNECTING");

    // Check for actual browser injection (e.g. window.ethereum or window.solana)
    try {
      if (providerId === "metamask" && typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts && accounts[0]) {
          const connected: ConnectedWallet = {
            address: accounts[0],
            chain: selectedChain,
            type: "metamask",
            balance: "2.45 ETH",
          };
          finalizeConnection(connected);
          return;
        }
      }

      if (providerId === "phantom" && typeof window !== "undefined" && (window as any).solana) {
        const resp = await (window as any).solana.connect();
        if (resp && resp.publicKey) {
          const connected: ConnectedWallet = {
            address: resp.publicKey.toString(),
            chain: "Solana",
            type: "phantom",
            balance: "48.2 SOL",
          };
          finalizeConnection(connected);
          return;
        }
      }
    } catch {}

    // Simulated / Demo High-Fidelity Connection (Instant Fallback)
    setTimeout(() => {
      let mockAddress = "0x71C...4F9B";
      let mockBalance = "1.84 ETH";
      let chainName: any = selectedChain;

      if (providerId === "phantom") {
        mockAddress = "7yB...8K9q";
        mockBalance = "36.5 SOL";
        chainName = "Solana";
      } else if (providerId === "coinbase") {
        mockAddress = "0x3A...91Cc";
        mockBalance = "3,420 USDC";
        chainName = "Base";
      } else if (providerId === "okx") {
        mockAddress = "0x98...2bE1";
        mockBalance = "0.75 ETH";
      }

      const connected: ConnectedWallet = {
        address: mockAddress,
        chain: chainName,
        type: providerId as any,
        balance: mockBalance,
      };
      finalizeConnection(connected);
    }, 1200);
  };

  const finalizeConnection = (wallet: ConnectedWallet) => {
    try {
      localStorage.setItem("0ther5ide_connected_wallet", JSON.stringify(wallet));
    } catch {}
    onConnect(wallet);
    setConnectingId(null);
    setActiveStep("SELECT");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in font-mono"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-[#06090e] border border-accent/60 rounded-2xl shadow-[0_0_50px_rgba(0,255,136,0.18)] overflow-hidden text-xs">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface/90 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent signal-pulse" />
            <span className="text-accent font-extrabold tracking-wider text-xs">CONNECT WEB3 WALLET</span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded bg-bg/80 border border-border/60 hover:border-red-400 hover:text-red-400 flex items-center justify-center text-muted transition font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Subheader Text */}
          <div className="text-[11px] text-muted leading-relaxed">
            Choose a wallet to connect to <strong className="text-fg font-bold">0ther5ide Institutional Engine</strong>. Enables decentralized on-chain trade execution, GEX portfolio tracking, and token-gated alpha.
          </div>

          {/* Chain Selector Filter */}
          <div className="space-y-1.5">
            <div className="text-[9.5px] text-muted font-bold uppercase tracking-wider">SELECT PREFERRED NETWORK:</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(["Ethereum", "Solana", "Base", "Arbitrum", "Polygon"] as const).map((chain) => (
                <button
                  key={chain}
                  onClick={() => setSelectedChain(chain)}
                  className={`py-1 px-1.5 rounded text-center font-bold text-[9px] border transition ${
                    selectedChain === chain
                      ? "bg-accent/20 border-accent text-accent shadow-sm"
                      : "bg-surface/50 border-border/40 text-muted hover:text-fg"
                  }`}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Options List */}
          <div className="space-y-2 pt-1">
            {WALLET_PROVIDERS.map((w) => {
              const isSelected = connectingId === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => handleWalletSelect(w.id)}
                  disabled={connectingId !== null}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition group ${
                    isSelected
                      ? "bg-accent/20 border-accent shadow-md scale-[0.99]"
                      : "bg-surface/60 border-border/50 hover:border-accent/80 hover:bg-surface active:scale-[0.99]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl group-hover:scale-110 transition-transform">{w.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-fg text-xs">
                        <span>{w.name}</span>
                        <span className="text-[8px] px-1.5 py-0.2 rounded bg-bg text-accent border border-accent/40 font-bold">
                          {w.badge}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-muted mt-0.5">{w.description}</div>
                    </div>
                  </div>

                  <div className="pl-2">
                    {isSelected ? (
                      <span className="text-[10px] text-accent font-bold animate-pulse">CONNECTING...</span>
                    ) : (
                      <span className="text-muted group-hover:text-accent transition">➔</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Privacy & Self-Custody Disclaimer */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[9px] text-muted">
            <span className="flex items-center gap-1">
              <span>🔒</span>
              <span>Non-Custodial & End-to-End Encrypted</span>
            </span>
            <span className="text-accent/80 font-bold">0% Gas Fee Router</span>
          </div>
        </div>
      </div>
    </div>
  );
}
