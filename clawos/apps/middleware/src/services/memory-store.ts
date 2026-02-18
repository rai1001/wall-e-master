import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { connect, type Table } from "@lancedb/lancedb";

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

type MemoryBackend = "json" | "lancedb";

interface LanceMemoryRow {
  id: string;
  content: string;
  score: number;
  priority_score: number;
  access_count: number;
  agent_id: string;
  project_id: string;
  source: string;
  timestamp: string;
  tags: string;
  pinned: boolean;
  vector: number[];
}

const LANCEDB_TABLE_NAME = "memory_chunks";
const VECTOR_DIMENSIONS = 16;

class MemoryStore {
  private readonly backend: MemoryBackend;
  private readonly storagePath?: string;
  private readonly rows: MemorySearchResult[] = [];
  private lanceTablePromise: Promise<Table> | null = null;

  constructor(storagePath?: string) {
    this.storagePath = storagePath;
    this.backend = this.resolveBackend();

    if (this.backend === "lancedb") {
      return;
    }

    const loaded = this.loadJsonRows();
    if (loaded.length > 0) {
      this.rows.push(...loaded);
      return;
    }

    this.rows.push(...this.buildSeedRows());

    this.persistJsonRows();
  }

  async add(input: MemoryIngestInput): Promise<string> {
    if (this.backend === "lancedb") {
      return this.addToLanceDb(input);
    }

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
    this.persistJsonRows();
    return id;
  }

  async search(query: string): Promise<MemorySearchResult[]> {
    if (this.backend === "lancedb") {
      return this.searchInLanceDb(query);
    }

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
    this.persistJsonRows();

    return results;
  }

  async pin(memoryId: string): Promise<MemorySearchResult | null> {
    if (this.backend === "lancedb") {
      return this.pinInLanceDb(memoryId);
    }

    const row = this.rows.find((item) => item.id === memoryId);
    if (!row) {
      return null;
    }

    row.priority_score = Math.min(15, row.priority_score + 3);
    row.score = Math.min(0.99, row.score + 0.05);
    row.pinned = true;
    this.persistJsonRows();
    return row;
  }

  private resolveBackend(): MemoryBackend {
    const raw = process.env.CLAWOS_MEMORY_BACKEND?.trim().toLowerCase() ?? "json";
    return raw === "lancedb" ? "lancedb" : "json";
  }

  private buildSeedRows(): MemorySearchResult[] {
    return [
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

  private resolveLanceDbDir(): string {
    if (this.storagePath?.trim()) {
      if (this.storagePath.endsWith(".json")) {
        return join(dirname(this.storagePath), "lancedb");
      }

      return this.storagePath;
    }

    const explicitLanceDir = process.env.CLAWOS_MEMORY_LANCEDB_DIR?.trim();
    if (explicitLanceDir) {
      return explicitLanceDir;
    }

    const explicitMemoryDir = process.env.CLAWOS_MEMORY_DIR?.trim();
    if (explicitMemoryDir) {
      return join(explicitMemoryDir, "lancedb");
    }

    return join(process.cwd(), "workspace", "memory", "lancedb");
  }

  private loadJsonRows(): MemorySearchResult[] {
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

  private persistJsonRows(): void {
    const path = this.resolveStoragePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(this.rows, null, 2), "utf8");
  }

  private async getLanceTable(): Promise<Table> {
    if (!this.lanceTablePromise) {
      this.lanceTablePromise = this.initializeLanceTable();
    }

    return this.lanceTablePromise;
  }

  private async initializeLanceTable(): Promise<Table> {
    const dbDir = this.resolveLanceDbDir();
    mkdirSync(dbDir, { recursive: true });
    const db = await connect(dbDir);
    const seedRows = this.buildSeedRows().map((row) => this.toLanceRow(row));

    try {
      const table = await db.openTable(LANCEDB_TABLE_NAME);
      const rowCount = await table.countRows();
      if (rowCount === 0) {
        await table.add(seedRows);
      }
      return table;
    } catch {
      return db.createTable(LANCEDB_TABLE_NAME, seedRows);
    }
  }

  private toLanceRow(row: MemorySearchResult): LanceMemoryRow {
    return {
      id: row.id,
      content: row.content,
      score: row.score,
      priority_score: row.priority_score,
      access_count: row.access_count,
      agent_id: row.metadata.agent_id,
      project_id: row.metadata.project_id,
      source: row.metadata.source,
      timestamp: row.metadata.timestamp,
      tags: row.metadata.tags.join(","),
      pinned: row.pinned === true,
      vector: this.embedText(`${row.content} ${row.metadata.tags.join(" ")}`)
    };
  }

  private parseLanceRow(raw: Record<string, unknown>): LanceMemoryRow | null {
    if (
      typeof raw.id !== "string" ||
      typeof raw.content !== "string" ||
      typeof raw.score !== "number" ||
      typeof raw.priority_score !== "number" ||
      typeof raw.access_count !== "number" ||
      typeof raw.agent_id !== "string" ||
      typeof raw.project_id !== "string" ||
      typeof raw.source !== "string" ||
      typeof raw.timestamp !== "string" ||
      typeof raw.tags !== "string" ||
      typeof raw.pinned !== "boolean"
    ) {
      return null;
    }

    return {
      id: raw.id,
      content: raw.content,
      score: raw.score,
      priority_score: raw.priority_score,
      access_count: raw.access_count,
      agent_id: raw.agent_id,
      project_id: raw.project_id,
      source: raw.source,
      timestamp: raw.timestamp,
      tags: raw.tags,
      pinned: raw.pinned,
      vector: this.normalizeVector(raw.vector)
    };
  }

  private normalizeVector(value: unknown): number[] {
    if (value === undefined || value === null) {
      return [];
    }

    let rawValues: unknown[] | null = null;
    if (Array.isArray(value)) {
      rawValues = value;
    } else if (typeof value === "object") {
      const maybeWithToArray = value as { toArray?: () => unknown };
      if (typeof maybeWithToArray.toArray === "function") {
        const converted = maybeWithToArray.toArray();
        if (Array.isArray(converted)) {
          rawValues = converted;
        }
      }

      if (!rawValues && Symbol.iterator in value) {
        rawValues = Array.from(value as Iterable<unknown>);
      }
    }

    if (!rawValues) {
      return [];
    }

    const numeric = rawValues.map((item) => Number(item));
    return numeric.every((item) => Number.isFinite(item)) ? numeric : [];
  }

  private toSearchResult(row: LanceMemoryRow, scoreOverride?: number): MemorySearchResult {
    const tags = row.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    return {
      id: row.id,
      content: row.content,
      score: scoreOverride ?? row.score,
      priority_score: row.priority_score,
      access_count: row.access_count,
      pinned: row.pinned,
      metadata: {
        agent_id: row.agent_id,
        project_id: row.project_id,
        source: row.source,
        timestamp: row.timestamp,
        tags
      }
    };
  }

  private escapeWhereValue(value: string): string {
    return value.replace(/'/g, "''");
  }

  private embedText(text: string): number[] {
    const output = Array.from({ length: VECTOR_DIMENSIONS }, () => 0);
    for (let index = 0; index < text.length; index += 1) {
      output[index % VECTOR_DIMENSIONS] += text.charCodeAt(index) % 127;
    }

    const norm = Math.sqrt(output.reduce((acc, value) => acc + value * value, 0)) || 1;
    return output.map((value) => value / norm);
  }

  private async addToLanceDb(input: MemoryIngestInput): Promise<string> {
    const table = await this.getLanceTable();
    const id = randomUUID();
    const priority = input.priority_score ?? 5;
    const tags = input.metadata.tags ?? [];
    const content = input.content;
    const score = Math.min(0.99, 0.5 + priority / 20);

    const row: LanceMemoryRow = {
      id,
      content,
      score,
      priority_score: priority,
      access_count: 0,
      agent_id: input.metadata.agent_id,
      project_id: input.metadata.project_id,
      source: input.metadata.source,
      timestamp: input.metadata.timestamp ?? new Date().toISOString(),
      tags: tags.join(","),
      pinned: false,
      vector: this.embedText(`${content} ${tags.join(" ")}`)
    };

    await table.add([row]);
    return id;
  }

  private async searchInLanceDb(query: string): Promise<MemorySearchResult[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    const table = await this.getLanceTable();
    const vector = this.embedText(normalized);
    const rawRows = (await (table as any).vectorSearch(vector).limit(50).toArray()) as Array<Record<string, unknown>>;

    const rankedRows = rawRows
      .map((raw) => {
        const parsed = this.parseLanceRow(raw);
        if (!parsed) {
          return null;
        }

        const tags = parsed.tags.toLowerCase();
        const content = parsed.content.toLowerCase();
        const textMatch = content.includes(normalized) || tags.includes(normalized);
        const distance = typeof raw._distance === "number" ? raw._distance : 0;
        const semanticScore = 1 / (1 + Math.max(distance, 0));
        const textBoost = textMatch ? 0.15 : 0;
        const priorityBoost = parsed.priority_score / 40;
        const pinnedBoost = parsed.pinned ? 0.05 : 0;
        const computedScore = Math.min(0.99, semanticScore + textBoost + priorityBoost + pinnedBoost);

        return {
          row: parsed,
          score: Number(computedScore.toFixed(4))
        };
      })
      .filter((item): item is { row: LanceMemoryRow; score: number } => item !== null)
      .sort((a, b) => b.score - a.score);

    await Promise.all(
      rankedRows.map(async ({ row, score }) => {
        const nextAccessCount = row.access_count + 1;
        await table.update({
          where: `id = '${this.escapeWhereValue(row.id)}'`,
          values: {
            access_count: nextAccessCount,
            score
          }
        });
      })
    );

    return rankedRows.map(({ row, score }) =>
      this.toSearchResult(
        {
          ...row,
          access_count: row.access_count + 1,
          score
        },
        score
      )
    );
  }

  private async pinInLanceDb(memoryId: string): Promise<MemorySearchResult | null> {
    const table = await this.getLanceTable();
    const escapedId = this.escapeWhereValue(memoryId);
    const rawRows = (await (table as any).query().where(`id = '${escapedId}'`).limit(1).toArray()) as Array<
      Record<string, unknown>
    >;
    const first = rawRows[0];
    if (!first) {
      return null;
    }

    const parsed = this.parseLanceRow(first);
    if (!parsed) {
      return null;
    }

    const nextPriority = Math.min(15, parsed.priority_score + 3);
    const nextScore = Math.min(0.99, parsed.score + 0.05);

    await table.update({
      where: `id = '${escapedId}'`,
      values: {
        priority_score: nextPriority,
        score: nextScore,
        pinned: true
      }
    });

    return this.toSearchResult(
      {
        ...parsed,
        priority_score: nextPriority,
        score: nextScore,
        pinned: true
      },
      nextScore
    );
  }
}

export { MemoryStore };
export type { MemorySearchResult, MemoryIngestInput };
