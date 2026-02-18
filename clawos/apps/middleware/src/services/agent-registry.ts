import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, type Dirent } from "node:fs";
import { basename, dirname, join } from "node:path";

import type { Agent, AgentStatus, MemoryAccess } from "./agent-factory";

class AgentRegistry {
  private readonly storagePath?: string;

  constructor(storagePath?: string) {
    this.storagePath = storagePath;
  }

  register(agent: Agent): void {
    const agents = this.loadAgents();
    agents.set(agent.id, agent);
    this.saveAgents(agents);
  }

  list(): Agent[] {
    return Array.from(this.loadAgents().values());
  }

  updateStatus(agentId: string, status: AgentStatus): Agent | null {
    const agents = this.loadAgents();
    const current = agents.get(agentId);
    if (!current) {
      return null;
    }

    const updated: Agent = {
      ...current,
      status
    };

    agents.set(agentId, updated);
    this.saveAgents(agents);
    return updated;
  }

  updatePermissions(agentId: string, skills: string[], memoryAccess: MemoryAccess): Agent | null {
    const agents = this.loadAgents();
    const current = agents.get(agentId);
    if (!current) {
      return null;
    }

    const updated: Agent = {
      ...current,
      skills,
      memory_access: memoryAccess
    };

    agents.set(agentId, updated);
    this.saveAgents(agents);
    return updated;
  }

  private resolveStoragePath(): string {
    if (this.storagePath && this.storagePath.trim().length > 0) {
      return this.storagePath;
    }

    const envPath = process.env.CLAWOS_AGENT_REGISTRY_PATH?.trim();
    if (envPath) {
      return envPath;
    }

    const baseDir = process.env.CLAWOS_AGENTS_DIR ?? join(process.cwd(), "workspace", "agents");
    return join(baseDir, "agents-registry.json");
  }

  private loadAgents(): Map<string, Agent> {
    const storagePath = this.resolveStoragePath();
    if (!existsSync(storagePath)) {
      const bootstrapped = this.bootstrapFromLegacyConfigs();
      if (bootstrapped.size > 0) {
        this.saveAgents(bootstrapped);
        return bootstrapped;
      }

      return new Map();
    }

    try {
      const raw = readFileSync(storagePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) {
        return new Map();
      }

      const map = new Map<string, Agent>();
      for (const row of parsed) {
        const agent = this.parseAgent(row);
        if (agent) {
          map.set(agent.id, agent);
        }
      }

      return map;
    } catch {
      return new Map();
    }
  }

  private saveAgents(agents: Map<string, Agent>): void {
    const storagePath = this.resolveStoragePath();
    mkdirSync(dirname(storagePath), { recursive: true });
    writeFileSync(storagePath, JSON.stringify(Array.from(agents.values()), null, 2), "utf8");
  }

  private bootstrapFromLegacyConfigs(): Map<string, Agent> {
    const baseDir = this.resolveLegacyBaseDir();
    if (!existsSync(baseDir)) {
      return new Map();
    }

    const configPaths = this.findLegacyConfigFiles(baseDir);
    const agents = new Map<string, Agent>();

    for (const configPath of configPaths) {
      try {
        const raw = readFileSync(configPath, "utf8");
        const parsed = JSON.parse(raw) as unknown;
        const agent = this.parseLegacyConfig(parsed, configPath);
        if (agent) {
          agents.set(agent.id, agent);
        }
      } catch {
        // ignore invalid legacy files and continue bootstrapping others
      }
    }

    return agents;
  }

  private resolveLegacyBaseDir(): string {
    if (process.env.CLAWOS_AGENTS_DIR) {
      return process.env.CLAWOS_AGENTS_DIR;
    }

    return dirname(this.resolveStoragePath());
  }

  private findLegacyConfigFiles(baseDir: string): string[] {
    const stack: string[] = [baseDir];
    const files: string[] = [];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }

      let entries: Dirent[];
      try {
        entries = readdirSync(current, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of entries) {
        const fullPath = join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }

        if (entry.isFile() && entry.name.endsWith(".config.json")) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  private parseAgent(value: unknown): Agent | null {
    if (!value || typeof value !== "object") {
      return null;
    }

    const row = value as Record<string, unknown>;
    const skills = Array.isArray(row.skills) ? row.skills.map((item) => String(item)) : null;

    if (
      typeof row.id !== "string" ||
      typeof row.name !== "string" ||
      typeof row.role !== "string" ||
      typeof row.personality_path !== "string" ||
      typeof row.voice_id !== "string" ||
      !skills ||
      (row.memory_access !== "global" && row.memory_access !== "private") ||
      (row.status !== "idle" && row.status !== "busy" && row.status !== "sleeping")
    ) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      role: row.role,
      personality_path: row.personality_path,
      voice_id: row.voice_id,
      skills,
      memory_access: row.memory_access,
      status: row.status
    };
  }

  private parseLegacyConfig(value: unknown, configPath: string): Agent | null {
    if (!value || typeof value !== "object") {
      return null;
    }

    const row = value as Record<string, unknown>;
    const inferredSlug = basename(configPath, ".config.json");

    const id = typeof row.id === "string" && row.id.trim().length > 0 ? row.id.trim() : `legacy-${inferredSlug}`;
    const name = typeof row.name === "string" && row.name.trim().length > 0 ? row.name.trim() : inferredSlug;
    const role = typeof row.role === "string" && row.role.trim().length > 0 ? row.role.trim() : "Generalist";
    const personalityPath =
      typeof row.personality_path === "string" && row.personality_path.trim().length > 0
        ? row.personality_path.trim()
        : `/souls/${inferredSlug}.md`;
    const voiceId =
      typeof row.voice_id === "string" && row.voice_id.trim().length > 0 ? row.voice_id.trim() : "voice_default";
    const skills = Array.isArray(row.skills)
      ? row.skills.map((item) => String(item).trim()).filter((item) => item.length > 0)
      : [];
    const memoryAccess: MemoryAccess = row.memory_access === "global" ? "global" : "private";
    const status: AgentStatus =
      row.status === "busy" || row.status === "sleeping" || row.status === "idle" ? row.status : "idle";

    return {
      id,
      name,
      role,
      personality_path: personalityPath,
      voice_id: voiceId,
      skills,
      memory_access: memoryAccess,
      status
    };
  }
}

export { AgentRegistry };
