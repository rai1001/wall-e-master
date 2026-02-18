import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { AgentRuntimeEvent } from "./openclaw-bridge";

interface StoredProjectEvent extends AgentRuntimeEvent {
  id: string;
}

class ProjectEventsStore {
  private readonly storagePath?: string;
  private readonly eventsByProject = new Map<string, StoredProjectEvent[]>();
  private readonly maxEventsPerProject = 200;

  constructor(storagePath?: string) {
    this.storagePath = storagePath;
    this.loadPersisted();
  }

  record(event: AgentRuntimeEvent): StoredProjectEvent {
    const stored: StoredProjectEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
    };

    const list = this.eventsByProject.get(event.project_id) ?? [];
    list.unshift(stored);
    if (list.length > this.maxEventsPerProject) {
      list.length = this.maxEventsPerProject;
    }

    this.eventsByProject.set(event.project_id, list);
    this.persist();
    return stored;
  }

  list(projectId: string, limit = 20): StoredProjectEvent[] {
    const rows = this.eventsByProject.get(projectId) ?? [];
    return rows.slice(0, Math.max(1, Math.min(limit, 100))).map((row) => ({ ...row }));
  }

  private resolveStoragePath(): string {
    if (this.storagePath?.trim()) {
      return this.storagePath;
    }

    const explicitPath = process.env.CLAWOS_PROJECT_EVENTS_PATH?.trim();
    if (explicitPath) {
      return explicitPath;
    }

    const baseDir = process.env.CLAWOS_PROJECT_EVENTS_DIR?.trim() ?? join(process.cwd(), "workspace", "projects");
    return join(baseDir, "project-events.json");
  }

  private loadPersisted(): void {
    const path = this.resolveStoragePath();
    if (!existsSync(path)) {
      return;
    }

    try {
      const raw = readFileSync(path, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return;
      }

      for (const entry of parsed) {
        if (!entry || typeof entry !== "object") {
          continue;
        }

        const row = entry as Record<string, unknown>;
        if (
          typeof row.id !== "string" ||
          typeof row.project_id !== "string" ||
          typeof row.kind !== "string" ||
          typeof row.content !== "string" ||
          typeof row.timestamp !== "string"
        ) {
          continue;
        }

        if (row.kind !== "thought" && row.kind !== "action") {
          continue;
        }

        const projectList = this.eventsByProject.get(row.project_id) ?? [];
        projectList.push({
          id: row.id,
          project_id: row.project_id,
          kind: row.kind,
          content: row.content,
          timestamp: row.timestamp,
          agent_id: typeof row.agent_id === "string" ? row.agent_id : undefined,
          agent_name: typeof row.agent_name === "string" ? row.agent_name : undefined
        });
        this.eventsByProject.set(row.project_id, projectList);
      }

      for (const [projectId, rows] of this.eventsByProject.entries()) {
        rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        if (rows.length > this.maxEventsPerProject) {
          rows.length = this.maxEventsPerProject;
        }
        this.eventsByProject.set(projectId, rows);
      }
    } catch {
      // ignore corrupt store and continue from empty
    }
  }

  private persist(): void {
    const path = this.resolveStoragePath();
    mkdirSync(dirname(path), { recursive: true });

    const rows = Array.from(this.eventsByProject.values()).flat();
    writeFileSync(path, JSON.stringify(rows, null, 2), "utf8");
  }
}

const projectEventsStore = new ProjectEventsStore();

export { ProjectEventsStore, projectEventsStore };
export type { StoredProjectEvent };
