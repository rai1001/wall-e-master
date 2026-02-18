import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { MemoryStore } from "../services/memory-store";

const previousBackend = process.env.CLAWOS_MEMORY_BACKEND;

afterEach(() => {
  if (previousBackend === undefined) {
    delete process.env.CLAWOS_MEMORY_BACKEND;
  } else {
    process.env.CLAWOS_MEMORY_BACKEND = previousBackend;
  }
});

describe("memory store lance backend", () => {
  it("supports add/search/pin with a LanceDB directory path", async () => {
    process.env.CLAWOS_MEMORY_BACKEND = "lancedb";
    const dbDir = mkdtempSync(join(tmpdir(), "clawos-memory-lancedb-"));

    try {
      const storeA = new MemoryStore(dbDir);
      const memoryId = await storeA.add({
        content: "OpenClaw websocket is on 127.0.0.1:18789",
        metadata: {
          agent_id: "lince",
          project_id: "proj_ldb",
          source: "system",
          tags: ["openclaw", "websocket"]
        },
        priority_score: 10
      });

      const storeB = new MemoryStore(dbDir);
      const results = await storeB.search("openclaw websocket");
      const row = results.find((item) => item.id === memoryId);
      expect(row).toBeDefined();

      const pinned = await storeB.pin(memoryId);
      expect(pinned?.pinned).toBe(true);
      expect((pinned?.priority_score ?? 0) >= 10).toBe(true);
    } finally {
      rmSync(dbDir, { recursive: true, force: true });
    }
  });
});
