import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
  private readonly currentDir = dirname(fileURLToPath(import.meta.url));
  private readonly templatesDir = join(this.currentDir, "..", "templates");

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

    const baseDir = process.env.CLAWOS_AGENTS_DIR ?? join(process.cwd(), "workspace", "agents");
    const agentDir = join(baseDir, slug);
    mkdirSync(agentDir, { recursive: true });

    const replacements = {
      "{{agent_name}}": input.name,
      "{{agent_role}}": input.role,
      "{{voice_id}}": input.voice_id,
      "{{skills}}": input.skills.join(", ")
    };

    const soulPath = join(agentDir, "SOUL.md");
    const identityPath = join(agentDir, "IDENTITY.md");
    const bridgePath = join(agentDir, "CONTEXT_BRIDGE.md");
    const configPath = join(agentDir, `${slug}.config.json`);

    writeFileSync(soulPath, this.renderTemplate("SOUL.md", replacements), "utf8");
    writeFileSync(identityPath, this.renderTemplate("IDENTITY.md", replacements), "utf8");
    writeFileSync(bridgePath, this.renderTemplate("CONTEXT_BRIDGE.md", replacements), "utf8");
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          memory_access: agent.memory_access
        },
        null,
        2
      ),
      "utf8"
    );

    return {
      agent,
      files_created: [soulPath, identityPath, bridgePath, configPath]
    };
  }

  private renderTemplate(fileName: string, replacements: Record<string, string>): string {
    let template = readFileSync(join(this.templatesDir, fileName), "utf8");

    for (const [token, value] of Object.entries(replacements)) {
      template = template.replaceAll(token, value);
    }

    return template;
  }
}

export { AgentFactory };
export type { SpawnAgentInput, SpawnAgentResult };
