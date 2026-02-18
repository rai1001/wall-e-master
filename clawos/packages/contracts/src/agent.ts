export type MemoryAccess = "global" | "private";
export type AgentStatus = "idle" | "busy" | "sleeping";

export interface Agent {
  id: string;
  name: string;
  role: string;
  personality_path: string;
  voice_id: string;
  skills: string[];
  memory_access: MemoryAccess;
  status: AgentStatus;
}

export interface SpawnAgentRequest {
  name: string;
  role: string;
  voice_id: string;
  skills: string[];
  memory_access: MemoryAccess;
}

export interface SpawnAgentResponse {
  agent: Agent;
  files_created: string[];
}
