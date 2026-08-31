export type AgentRole = "RECON" | "WHALE_HUNTER" | "ORBITAL_SENTINEL" | "SYNTHESIS_COMMANDER";

export interface SwarmAgent {
  id: string;
  name: string;
  codename: string;
  role: AgentRole;
  avatar: string;
  status: "IDLE" | "SCANNING" | "PROCESSING" | "REPORTING";
  currentTask: string;
  lastActive: string;
  observationsCount: number;
  confidenceScore: number;
}

export interface SwarmLog {
  id: string;
  agentCodename: string;
  role: AgentRole;
  message: string;
  timestamp: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "ACTION";
  payload?: any;
}

export interface SwarmSynthesis {
  missionId: string;
  timestamp: string;
  consensusScore: number; // 0 - 100
  threatLevel: "SEVERE" | "HIGH" | "ELEVATED" | "LOW";
  executiveBrief: string;
  keyFindings: string[];
  recommendedActions: string[];
  activeAgentsCount: number;
  sourcesScannedCount: number;
}

export interface SwarmState {
  agents: SwarmAgent[];
  logs: SwarmLog[];
  latestSynthesis: SwarmSynthesis;
  isSweeping: boolean;
  totalSweepsCompleted: number;
}
