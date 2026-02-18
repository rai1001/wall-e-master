import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

interface MemorySearchResult {
  id: string;
  content: string;
  score: number;
  priority_score: number;
  access_count: number;
  metadata: {
    agent_id: string;
    project_id: string;
    source: string;
    timestamp: string;
    tags: string[];
  };
  pinned?: boolean;
}

interface MemoryIngestInput {
  content: string;
  metadata: {
    agent_id: string;
    project_id: string;
    source: string;
    timestamp?: string;
    tags?: string[];
  };
  priority_score?: number;
}

class MemoryStore {
  private readonly storagePath?: string;
  private readonly rows: MemorySearchResult[];

  constructor(storagePath?: string) {
    this.storagePath = storagePath;
    const loaded = this.loadRows();
    if (loaded.length > 0) {
      this.rows = loaded;
      return;
    }

    this.rows = [
      {
        id: randomUUID(),
        content: "User prefers React over Vue for frontend work",
        score: 0.89,
        priority_score: 8,
        access_count: 0,
        metadata: {
          agent_id: "sastre-coder",
          project_id: "proj_001",
          source: "chat",
          timestamp: new Date().toISOString(),
          tags: ["preferences", "frontend"]
        }
      },
      {
        id: randomUUID(),
        content: "OpenClaw websocket daemon runs on 127.0.0.1:18789",
        score: 0.86,
        priority_score: 9,
        access_count: 0,
        metadata: {
          agent_id: "lince",
          project_id: "proj_001",
          source: "system",
          timestamp: new Date().toISOString(),
          tags: ["openclaw", "websocket"]
        }
      }
    ];

    this.persistRows();
  }

  add(input: MemoryIngestInput): string {
    const id = randomUUID();
    const priority = input.priority_score ?? 5;

    const record: MemorySearchResult = {
      id,
      content: input.content,
      score: Math.min(0.99, 0.5 + priority / 20),
      priority_score: priority,
      access_count: 0,
      metadata: {
        agent_id: input.metadata.agent_id,
        project_id: input.metadata.project_id,
        source: input.metadata.source,
        timestamp: input.metadata.timestamp ?? new Date().toISOString(),
        tags: input.metadata.tags ?? []
      }
    };

    this.rows.push(record);
    this.persistRows();
    return id;
  }

  search(query: string): MemorySearchResult[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    const results = this.rows
      .filter((row) => row.content.toLowerCase().includes(normalized) || row.metadata.tags.some((tag) => tag.includes(normalized)))
      .sort((a, b) => b.score - a.score);

    for (const row of results) {
      row.access_count += 1;
    }
    this.persistRows();

    return results;
  }

  pin(memoryId: string): MemorySearchResult | null {
    const row = this.rows.find((item) => item.id === memoryId);
    if (!row) {
      return null;
    }

    row.priority_score = Math.min(15, row.priority_score + 3);
    row.score = Math.min(0.99, row.score + 0.05);
    row.pinned = true;
    this.persistRows();
    return row;
  }

  private resolveStoragePath(): string {
    if (this.storagePath?.trim()) {
      return this.storagePath;
    }

    const explicitPath = process.env.CLAWOS_MEMORY_PATH?.trim();
    if (explicitPath) {
      return explicitPath;
    }

    const baseDir = process.env.CLAWOS_MEMORY_DIR?.trim() ?? join(process.cwd(), "workspace", "memory");
    return join(baseDir, "memory-store.json");
  }

  private loadRows(): MemorySearchResult[] {
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

      const rows: MemorySearchResult[] = [];
      for (const value of parsed) {
        if (!value || typeof value !== "object") {
          continue;
        }

        const row = value as Record<string, unknown>;
        if (
          typeof row.id !== "string" ||
          typeof row.content !== "string" ||
          typeof row.score !== "number" ||
          typeof row.priority_score !== "number" ||
          typeof row.access_count !== "number" ||
          !row.metadata ||
          typeof row.metadata !== "object"
        ) {
          continue;
        }

        const metadata = row.metadata as Record<string, unknown>;
        if (
          typeof metadata.agent_id !== "string" ||
          typeof metadata.project_id !== "string" ||
          typeof metadata.source !== "string" ||
          typeof metadata.timestamp !== "string" ||
          !Array.isArray(metadata.tags)
        ) {
          continue;
        }

        rows.push({
          id: row.id,
          content: row.content,
          score: row.score,
          priority_score: row.priority_score,
          access_count: row.access_count,
          pinned: row.pinned === true,
          metadata: {
            agent_id: metadata.agent_id,
            project_id: metadata.project_id,
            source: metadata.source,
            timestamp: metadata.timestamp,
            tags: metadata.tags.map((tag) => String(tag))
          }
        });
      }

      return rows;
    } catch {
      return [];
    }
  }

  private persistRows(): void {
    const path = this.resolveStoragePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(this.rows, null, 2), "utf8");
  }
}

export { MemoryStore };
export type { MemorySearchResult, MemoryIngestInput };
