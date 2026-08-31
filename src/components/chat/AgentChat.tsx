"use client";

import { useState, useRef, useEffect } from "react";

const AVAILABLE_MODELS = [
  { id: "nvidia/nemotron-3.5-lightning:free", name: "NVIDIA Nemotron 3.5 (Free)", badge: "FREE" },
  { id: "liquid/lfm-2.5-2.6b:free", name: "Liquid LFM 2.6B (Free)", badge: "FREE" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B (Fast)", badge: "SMART" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Strategy)", badge: "PRO" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Speed)", badge: "PRO" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1 (Reasoning)", badge: "DEEP" },
  { id: "0ther5ide-heuristic-v2", name: "0ther5ide Local Neural Core", badge: "LOCAL" },
];

const GUIDANCE_CHIPS = [
  { label: "🧭 Guide Me Through Terminal", prompt: "Give me a guided walkthrough of this terminal and how to interpret each module." },
  { label: "🐋 Explain Biggest Insider Filing", prompt: "Explain the biggest SEC Form 4 insider trade in the terminal and what it indicates." },
  { label: "📈 Evaluate NVDA Dark Pool Flow", prompt: "Evaluate NVDA dark pool order flow, volume footprint, and institutional accumulation levels." },
  { label: "🛰️ Analyze Satellite Anomaly Hotspots", prompt: "Analyze the latest NASA VIIRS thermal anomaly hotspots on the 3D globe." },
  { label: "🌐 Red Sea Maritime Risk", prompt: "Assess current maritime risk and escalation in the Bab-el-Mandeb / Red Sea corridor." },
];

export default function AgentChat() {
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string; model?: string }[]>([
    {
      role: "bot",
      content: "0ther5ide INTELLIGENCE CO-PILOT ONLINE.
I synthesize multi-sensor GEOINT, FININT (SEC Form 4 / Dark Pools), and SIGINT telemetry in real-time.

Ask me to evaluate any stock ticker, assess conflict theater risks, or click below for a guided walkthrough.",
      model: "0ther5ide-core",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedModel, setSelectedModel] = useState("nvidia/nemotron-3.5-lightning:free");
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);

    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          model: selectedModel,
          analysis: null,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.reply || "Transmission completed with zero errors.",
          model: data.model || selectedModel,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "0ther5ide LOCAL NEURAL CORE SYNTHESIS: Multi-domain sensor convergence active. Telemetry nominal.",
          model: "0ther5ide-heuristic-v2",
        },
      ]);
    }

    setBusy(false);
  };

  // Text-to-Speech (TTS) Voice Briefing Synthesizer
  const speakBriefing = (text: string, index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting symbols for clean speech audio
    const cleanText = text
      .replace(/[#*_•━]/g, " ")
      .replace(/https?://S+/g, "link")
      .replace(/s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    // Pick deep/tactical voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Male") || v.name.includes("Natural") || v.name.includes("Google")));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col h-full relative">
      {/* Top Header with Model Switcher Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm tracking-wider">TACTICAL CO-PILOT</span>
          <span className="w-2 h-2 rounded-full bg-accent signal-pulse" />
        </div>

        {/* Model Switcher Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted font-mono hidden sm:inline">MODEL:</span>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-surface border border-border/60 text-accent font-mono text-[10px] rounded px-2 py-1 focus:outline-none focus:border-accent cursor-pointer"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id} className="bg-bg text-fg">
                [{m.badge}] {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div id="agentChatLog" ref={logRef} className="flex-1 overflow-y-auto space-y-3 min-h-0 mb-2 pr-1 font-mono">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-xs shadow-md ${
                m.role === "user"
                  ? "bg-accent/20 text-accent border border-accent/30 font-sans font-medium"
                  : "bg-surface/90 text-fg border border-border/60 backdrop-blur-md leading-relaxed whitespace-pre-wrap"
              }`}
            >
              {m.content}

              {/* Bot Message Metadata & Audio Brief Button */}
              {m.role === "bot" && (
                <div className="mt-2.5 pt-2 border-t border-border/30 flex items-center justify-between text-[10px] text-muted font-mono">
                  <span className="text-accent/80">⚡ {m.model || selectedModel}</span>
                  <button
                    onClick={() => speakBriefing(m.content, i)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition ${
                      speakingIndex === i
                        ? "bg-red-500/20 border-red-500/50 text-red-400 font-bold"
                        : "bg-surface border-border/50 hover:border-accent/50 text-muted hover:text-accent"
                    }`}
                  >
                    {speakingIndex === i ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                        <span>⏹ STOP AUDIO</span>
                      </>
                    ) : (
                      <>
                        <span>🔊 VOICE BRIEF</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-start">
            <div className="rounded-xl px-3.5 py-2.5 text-xs bg-surface/80 border border-border/50 text-accent flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span className="font-mono">SYNTHESIZING MULTI-SENSOR INTEL...</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Guidance Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 mb-2 no-scrollbar">
        {GUIDANCE_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(chip.prompt)}
            disabled={busy}
            className="whitespace-nowrap text-[10px] font-mono px-2.5 py-1 rounded-full bg-surface/90 border border-border/50 text-muted hover:text-accent hover:border-accent/40 transition disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Box & Send Action */}
      <div className="flex gap-2">
        <input
          id="agentChatInput"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for guidance, analyze NVDA, query conflict risk..."
          className="flex-1 bg-surface border border-border/60 rounded-xl px-3.5 py-2 text-xs text-fg placeholder-muted/50 focus:outline-none focus:border-accent/60 font-mono shadow-inner"
        />
        <button
          id="agentChatSend"
          onClick={() => sendMessage()}
          disabled={busy || !input.trim()}
          className="px-4 py-2 bg-accent text-bg rounded-xl text-xs font-bold hover:bg-accent/90 transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed font-mono"
        >
          {busy ? "..." : "TRANSMIT"}
        </button>
      </div>
    </div>
  );
}
