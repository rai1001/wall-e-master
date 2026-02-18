import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CostStore } from "../services/cost-store";
import { KnowledgeStore } from "../services/knowledge-store";
import { MemoryStore } from "../services/memory-store";

describe("durable stores", () => {
  it("persists memory chunks across store restarts", async () => {
    const workingDir = mkdtempSync(join(tmpdir(), "clawos-memory-store-"));
    const storagePath = join(workingDir, "memory-store.json");

    try {
      const memoryA = new MemoryStore(storagePath);
      const memoryId = await memoryA.add({
        content: "Stripe endpoint is now /v2",
        metadata: {
          agent_id: "lince",
          project_id: "proj_001",
          source: "web",
          tags: ["stripe"]
        },
        priority_score: 9
      });
      await memoryA.pin(memoryId);

      const memoryB = new MemoryStore(storagePath);
      const results = await memoryB.search("stripe");
      const row = results.find((item) => item.id === memoryId);

      expect(row).toBeDefined();
      expect(row?.pinned).toBe(true);
      expect(row?.metadata.project_id).toBe("proj_001");
    } finally {
      rmSync(workingDir, { recursive: true, force: true });
    }
  });

  it("persists project budgets across store restarts", () => {
    const workingDir = mkdtempSync(join(tmpdir(), "clawos-cost-store-"));
    const storagePath = join(workingDir, "cost-store.json");

    try {
      const costA = new CostStore(storagePath);
      costA.updateBudget("proj_001", 33);

      const costB = new CostStore(storagePath);
      const summary = costB.getSummary("proj_001");

      expect(summary.budget_usd).toBe(33);
    } finally {
      rmSync(workingDir, { recursive: true, force: true });
    }
  });

  it("persists handoff feed and graph across store restarts", () => {
    const workingDir = mkdtempSync(join(tmpdir(), "clawos-knowledge-store-"));
    const storagePath = join(workingDir, "knowledge-store.json");

    try {
      const knowledgeA = new KnowledgeStore(storagePath);
      knowledgeA.addHandoff({
        from_agent_id: "lince",
        to_agent_id: "sastre",
        project_id: "proj_001",
        content: "Use websocket reconnect strategy"
      });

      const knowledgeB = new KnowledgeStore(storagePath);
      const feed = knowledgeB.getFeed("proj_001");
      const graph = knowledgeB.getGraph("proj_001");

      expect(feed.length).toBe(1);
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.edges.length).toBeGreaterThan(0);
    } finally {
      rmSync(workingDir, { recursive: true, force: true });
    }
  });
});
