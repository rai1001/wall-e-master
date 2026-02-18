import { randomUUID } from "node:crypto";

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
  private readonly rows: MemorySearchResult[] = [
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

    return results;
  }
}

export { MemoryStore };
export type { MemorySearchResult, MemoryIngestInput };
