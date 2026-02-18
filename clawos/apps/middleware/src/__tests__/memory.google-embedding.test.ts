import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { MemoryStore } from "../services/memory-store";

const previousBackend = process.env.CLAWOS_MEMORY_BACKEND;
const previousEmbeddingProvider = process.env.CLAWOS_EMBEDDING_PROVIDER;
const previousGoogleApiKey = process.env.GOOGLE_API_KEY;

afterEach(() => {
  if (previousBackend === undefined) {
    delete process.env.CLAWOS_MEMORY_BACKEND;
  } else {
    process.env.CLAWOS_MEMORY_BACKEND = previousBackend;
  }

  if (previousEmbeddingProvider === undefined) {
    delete process.env.CLAWOS_EMBEDDING_PROVIDER;
  } else {
    process.env.CLAWOS_EMBEDDING_PROVIDER = previousEmbeddingProvider;
  }

  if (previousGoogleApiKey === undefined) {
    delete process.env.GOOGLE_API_KEY;
  } else {
    process.env.GOOGLE_API_KEY = previousGoogleApiKey;
  }

  vi.unstubAllGlobals();
});

describe("memory store google embedding provider", () => {
  it("returns actionable configuration error when google provider is set without api key", async () => {
    process.env.CLAWOS_MEMORY_BACKEND = "lancedb";
    process.env.CLAWOS_EMBEDDING_PROVIDER = "google";
    delete process.env.GOOGLE_API_KEY;

    const dbDir = mkdtempSync(join(tmpdir(), "clawos-memory-google-embedding-"));
    try {
      const store = new MemoryStore(dbDir);
      await expect(
        store.add({
          content: "OpenClaw websocket endpoint update",
          metadata: {
            agent_id: "lince",
            project_id: "proj_001",
            source: "system",
            tags: ["openclaw"]
          }
        })
      ).rejects.toThrow(/GOOGLE_API_KEY/);
    } finally {
      rmSync(dbDir, { recursive: true, force: true });
    }
  });

  it("embeds via Google provider when api key is configured", async () => {
    process.env.CLAWOS_MEMORY_BACKEND = "lancedb";
    process.env.CLAWOS_EMBEDDING_PROVIDER = "google";
    process.env.GOOGLE_API_KEY = "test-google-key";

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          embedding: {
            values: [0.1, 0.2, 0.3, 0.4]
          }
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
    );
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const dbDir = mkdtempSync(join(tmpdir(), "clawos-memory-google-embedding-"));
    try {
      const store = new MemoryStore(dbDir);
      const memoryId = await store.add({
        content: "Google embedding vector pipeline active",
        metadata: {
          agent_id: "lince",
          project_id: "proj_001",
          source: "system",
          tags: ["google", "embedding"]
        }
      });

      const results = await store.search("google embedding");
      expect(results.some((row) => row.id === memoryId)).toBe(true);
      expect(fetchMock).toHaveBeenCalled();

      const requestBodies = fetchMock.mock.calls
        .map((call) => {
          const init = call[1] as { body?: string } | undefined;
          if (!init?.body || typeof init.body !== "string") {
            return null;
          }

          return JSON.parse(init.body) as { taskType?: string };
        })
        .filter((value): value is { taskType?: string } => value !== null);

      expect(requestBodies.some((body) => body.taskType === "RETRIEVAL_QUERY")).toBe(true);
      expect(requestBodies.some((body) => body.taskType === "RETRIEVAL_DOCUMENT")).toBe(true);
    } finally {
      rmSync(dbDir, { recursive: true, force: true });
    }
  });
});
