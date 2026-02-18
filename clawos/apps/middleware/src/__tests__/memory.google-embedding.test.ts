import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { MemoryStore } from "../services/memory-store";

const previousBackend = process.env.CLAWOS_MEMORY_BACKEND;
const previousEmbeddingProvider = process.env.CLAWOS_EMBEDDING_PROVIDER;
const previousGoogleApiKey = process.env.GOOGLE_API_KEY;
const previousOpenAiApiKey = process.env.OPENAI_API_KEY;
const previousOpenAiEmbeddingModel = process.env.OPENAI_EMBEDDING_MODEL;
const previousOllamaEmbeddingBaseUrl = process.env.OLLAMA_EMBEDDING_BASE_URL;
const previousOllamaEmbeddingModel = process.env.OLLAMA_EMBEDDING_MODEL;

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

  if (previousOpenAiApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = previousOpenAiApiKey;
  }

  if (previousOpenAiEmbeddingModel === undefined) {
    delete process.env.OPENAI_EMBEDDING_MODEL;
  } else {
    process.env.OPENAI_EMBEDDING_MODEL = previousOpenAiEmbeddingModel;
  }

  if (previousOllamaEmbeddingBaseUrl === undefined) {
    delete process.env.OLLAMA_EMBEDDING_BASE_URL;
  } else {
    process.env.OLLAMA_EMBEDDING_BASE_URL = previousOllamaEmbeddingBaseUrl;
  }

  if (previousOllamaEmbeddingModel === undefined) {
    delete process.env.OLLAMA_EMBEDDING_MODEL;
  } else {
    process.env.OLLAMA_EMBEDDING_MODEL = previousOllamaEmbeddingModel;
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

  it("returns actionable configuration error when openai provider is set without api key", async () => {
    process.env.CLAWOS_MEMORY_BACKEND = "lancedb";
    process.env.CLAWOS_EMBEDDING_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;

    const dbDir = mkdtempSync(join(tmpdir(), "clawos-memory-openai-embedding-"));
    try {
      const store = new MemoryStore(dbDir);
      await expect(
        store.add({
          content: "OpenAI embedding config check",
          metadata: {
            agent_id: "lince",
            project_id: "proj_001",
            source: "system",
            tags: ["openai", "embedding"]
          }
        })
      ).rejects.toThrow(/OPENAI_API_KEY/);
    } finally {
      rmSync(dbDir, { recursive: true, force: true });
    }
  });

  it("embeds via OpenAI provider when api key is configured", async () => {
    process.env.CLAWOS_MEMORY_BACKEND = "lancedb";
    process.env.CLAWOS_EMBEDDING_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: [
            {
              embedding: [0.21, 0.1, -0.33, 0.51]
            }
          ]
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

    const dbDir = mkdtempSync(join(tmpdir(), "clawos-memory-openai-embedding-"));
    try {
      const store = new MemoryStore(dbDir);
      const memoryId = await store.add({
        content: "OpenAI embedding vector pipeline active",
        metadata: {
          agent_id: "lince",
          project_id: "proj_001",
          source: "system",
          tags: ["openai", "embedding"]
        }
      });

      const results = await store.search("openai embedding");
      expect(results.some((row) => row.id === memoryId)).toBe(true);
      expect(fetchMock).toHaveBeenCalled();

      const requestBodies = fetchMock.mock.calls
        .map((call) => {
          const init = call[1] as { body?: string } | undefined;
          if (!init?.body || typeof init.body !== "string") {
            return null;
          }

          return JSON.parse(init.body) as { model?: string };
        })
        .filter((value): value is { model?: string } => value !== null);

      expect(requestBodies.every((body) => body.model === "text-embedding-3-small")).toBe(true);
    } finally {
      rmSync(dbDir, { recursive: true, force: true });
    }
  });

  it("embeds via Ollama provider when configured", async () => {
    process.env.CLAWOS_MEMORY_BACKEND = "lancedb";
    process.env.CLAWOS_EMBEDDING_PROVIDER = "ollama";
    process.env.OLLAMA_EMBEDDING_BASE_URL = "http://127.0.0.1:11434";
    process.env.OLLAMA_EMBEDDING_MODEL = "nomic-embed-text";

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          embeddings: [[0.11, -0.08, 0.42, 0.09]]
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

    const dbDir = mkdtempSync(join(tmpdir(), "clawos-memory-ollama-embedding-"));
    try {
      const store = new MemoryStore(dbDir);
      const memoryId = await store.add({
        content: "Ollama embedding vector pipeline active",
        metadata: {
          agent_id: "lince",
          project_id: "proj_001",
          source: "system",
          tags: ["ollama", "embedding"]
        }
      });

      const results = await store.search("ollama embedding");
      expect(results.some((row) => row.id === memoryId)).toBe(true);
      expect(fetchMock).toHaveBeenCalled();
      const endpoint = String(fetchMock.mock.calls[0]?.[0]);
      expect(endpoint).toContain("/api/embed");

      const requestBodies = fetchMock.mock.calls
        .map((call) => {
          const init = call[1] as { body?: string } | undefined;
          if (!init?.body || typeof init.body !== "string") {
            return null;
          }

          return JSON.parse(init.body) as { model?: string; input?: string };
        })
        .filter((value): value is { model?: string; input?: string } => value !== null);

      expect(requestBodies.every((body) => body.model === "nomic-embed-text")).toBe(true);
      expect(requestBodies.every((body) => typeof body.input === "string" && body.input.length > 0)).toBe(true);
    } finally {
      rmSync(dbDir, { recursive: true, force: true });
    }
  });
});
