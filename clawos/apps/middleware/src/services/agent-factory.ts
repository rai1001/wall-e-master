import { randomUUID } from "node:crypto";

type MemoryAccess = "global" | "private";
type AgentStatus = "idle" | "busy" | "sleeping";

interface Agent {
  id: string;
  name: string;
  role: string;
  personality_path: string;
  voice_id: string;
  skills: string[];
  memory_access: MemoryAccess;
  status: AgentStatus;
}

interface SpawnAgentInput {
  name: string;
  role: string;
  voice_id: string;
  skills: string[];
  memory_access: MemoryAccess;
}

interface SpawnAgentResult {
  agent: Agent;
  files_created: string[];
}

class AgentFactory {
  spawn(input: SpawnAgentInput): SpawnAgentResult {
    const slug = input.name.trim().toLowerCase().replace(/\s+/g, "-");

    const agent: Agent = {
      id: randomUUID(),
      name: input.name,
      role: input.role,
      personality_path: `/souls/${slug}.md`,
      voice_id: input.voice_id,
      skills: input.skills,
      memory_access: input.memory_access,
      status: "idle"
    };

    return {
      agent,
      files_created: [agent.personality_path, `/agents/${slug}.config.json`]
    };
  }
}

export { AgentFactory };
export type { SpawnAgentInput, SpawnAgentResult };
