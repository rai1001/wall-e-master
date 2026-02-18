import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

interface HandoffEvent {
  id: string;
  project_id: string;
  from_agent_id: string;
  to_agent_id: string;
  content: string;
  timestamp: string;
}

class KnowledgeStore {
  private readonly storagePath?: string;
  private readonly handoffs: HandoffEvent[] = [];

  constructor(storagePath?: string) {
    this.storagePath = storagePath;
    this.handoffs.push(...this.loadHandoffs());
  }

  addHandoff(input: Omit<HandoffEvent, "id" | "timestamp">): HandoffEvent {
    const event: HandoffEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...input
    };

    this.handoffs.push(event);
    this.persistHandoffs();
    return event;
  }

  getFeed(projectId: string): HandoffEvent[] {
    return this.handoffs.filter((event) => event.project_id === projectId);
  }

  getGraph(projectId: string): { nodes: Array<Record<string, string>>; edges: Array<Record<string, string>> } {
    const events = this.getFeed(projectId);
    const nodeMap = new Map<string, Record<string, string>>();
    const edges: Array<Record<string, string>> = [];

    for (const event of events) {
      const fromId = `agent:${event.from_agent_id}`;
      const toId = `agent:${event.to_agent_id}`;
      const findingId = `finding:${event.id}`;

      nodeMap.set(fromId, { id: fromId, label: event.from_agent_id, type: "agent" });
      nodeMap.set(toId, { id: toId, label: event.to_agent_id, type: "agent" });
      nodeMap.set(findingId, { id: findingId, label: event.content, type: "finding" });

      edges.push({ from: fromId, to: findingId, relation: "hands_off" });
      edges.push({ from: findingId, to: toId, relation: "received_by" });
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges
    };
  }

  private resolveStoragePath(): string {
    if (this.storagePath?.trim()) {
      return this.storagePath;
    }

    const explicitPath = process.env.CLAWOS_KNOWLEDGE_PATH?.trim();
    if (explicitPath) {
      return explicitPath;
    }

    const baseDir = process.env.CLAWOS_KNOWLEDGE_DIR?.trim() ?? join(process.cwd(), "workspace", "knowledge");
    return join(baseDir, "knowledge-store.json");
  }

  private loadHandoffs(): HandoffEvent[] {
    const path = this.resolveStoragePath();
    if (!existsSync(path)) {
      return [];
    }

    try {
      const raw = readFileSync(path, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      const rows: HandoffEvent[] = [];
      for (const value of parsed) {
        if (!value || typeof value !== "object") {
          continue;
        }

        const row = value as Record<string, unknown>;
        if (
          typeof row.id !== "string" ||
          typeof row.project_id !== "string" ||
          typeof row.from_agent_id !== "string" ||
          typeof row.to_agent_id !== "string" ||
          typeof row.content !== "string" ||
          typeof row.timestamp !== "string"
        ) {
          continue;
        }

        rows.push({
          id: row.id,
          project_id: row.project_id,
          from_agent_id: row.from_agent_id,
          to_agent_id: row.to_agent_id,
          content: row.content,
          timestamp: row.timestamp
        });
      }

      return rows;
    } catch {
      return [];
    }
  }

  private persistHandoffs(): void {
    const path = this.resolveStoragePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(this.handoffs, null, 2), "utf8");
  }
}

const knowledgeStore = new KnowledgeStore();

export { knowledgeStore };
export { KnowledgeStore };
export type { HandoffEvent };
