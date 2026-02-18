import { Router } from "express";

import { MemoryEventBus } from "../services/memory-event-bus";
import { MemoryStore } from "../services/memory-store";

const memoryRouter = Router();
const memoryStore = new MemoryStore();
const memoryEventBus = new MemoryEventBus(memoryStore);

memoryRouter.get("/search", (req, res) => {
  const query = String(req.query.q ?? "");
  const projectId = String(req.query.project_id ?? "");
  const limitValue = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : 10;
  const allResults = memoryStore.search(query);
  const scopedResults = projectId ? allResults.filter((row) => row.metadata.project_id === projectId) : allResults;
  const results = scopedResults.slice(0, Math.min(limit, 50));

  res.status(200).json({
    query,
    project_id: projectId || undefined,
    results
  });
});

memoryRouter.post("/ingest", (req, res) => {
  const payload = req.body ?? {};
  const content = typeof payload.content === "string" ? payload.content : "";
  const metadata = payload.metadata ?? {};

  if (
    !content ||
    typeof metadata.agent_id !== "string" ||
    typeof metadata.project_id !== "string" ||
    typeof metadata.source !== "string"
  ) {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "Invalid memory ingest payload",
        details: {}
      }
    });
  }

  const result = memoryEventBus.ingest({
    content,
    metadata: {
      agent_id: metadata.agent_id,
      project_id: metadata.project_id,
      source: metadata.source,
      timestamp: typeof metadata.timestamp === "string" ? metadata.timestamp : undefined,
      tags: Array.isArray(metadata.tags) ? metadata.tags.map((item: unknown) => String(item)) : []
    },
    priority_score: typeof payload.priority_score === "number" ? payload.priority_score : undefined
  });

  return res.status(202).json(result);
});

export { memoryRouter };
