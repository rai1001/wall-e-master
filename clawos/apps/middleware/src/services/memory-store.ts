interface MemorySearchResult {
  content: string;
  score: number;
  metadata: {
    agent_id: string;
    project_id: string;
    source: string;
    tags: string[];
  };
}

class MemoryStore {
  private readonly rows: MemorySearchResult[] = [
    {
      content: "User prefers React over Vue for frontend work",
      score: 0.89,
      metadata: {
        agent_id: "sastre-coder",
        project_id: "proj_001",
        source: "chat",
        tags: ["preferences", "frontend"]
      }
    },
    {
      content: "OpenClaw websocket daemon runs on 127.0.0.1:18789",
      score: 0.86,
      metadata: {
        agent_id: "lince",
        project_id: "proj_001",
        source: "system",
        tags: ["openclaw", "websocket"]
      }
    }
  ];

  search(query: string): MemorySearchResult[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return this.rows
      .filter((row) => row.content.toLowerCase().includes(normalized) || row.metadata.tags.some((tag) => tag.includes(normalized)))
      .sort((a, b) => b.score - a.score);
  }
}

export { MemoryStore };
export type { MemorySearchResult };
