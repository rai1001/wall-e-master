import type { Agent, AgentStatus, MemoryAccess } from "./agent-factory";

class AgentRegistry {
  private readonly agentsById = new Map<string, Agent>();

  register(agent: Agent): void {
    this.agentsById.set(agent.id, agent);
  }

  list(): Agent[] {
    return Array.from(this.agentsById.values());
  }

  updateStatus(agentId: string, status: AgentStatus): Agent | null {
    const current = this.agentsById.get(agentId);
    if (!current) {
      return null;
    }

    const updated: Agent = {
      ...current,
      status
    };

    this.agentsById.set(agentId, updated);
    return updated;
  }

  updatePermissions(agentId: string, skills: string[], memoryAccess: MemoryAccess): Agent | null {
    const current = this.agentsById.get(agentId);
    if (!current) {
      return null;
    }

    const updated: Agent = {
      ...current,
      skills,
      memory_access: memoryAccess
    };

    this.agentsById.set(agentId, updated);
    return updated;
  }
}

export { AgentRegistry };
