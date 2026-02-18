import { Router } from "express";

import { MemoryEventBus } from "../services/memory-event-bus";
import { MemoryStore } from "../services/memory-store";
import { buildErrorResponse } from "../services/observability";

const memoryRouter = Router();
const memoryStore = new MemoryStore();
const memoryEventBus = new MemoryEventBus(memoryStore);

memoryRouter.get("/search", async (req, res) => {
  const query = String(req.query.q ?? "");
  const projectId = String(req.query.project_id ?? "");
  const limitValue = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : 10;
  const allResults = await memoryStore.search(query);
  const scopedResults = projectId ? allResults.filter((row) => row.metadata.project_id === projectId) : allResults;
  const results = scopedResults.slice(0, Math.min(limit, 50));

  return res.status(200).json({
    query,
    project_id: projectId || undefined,
    results
  });
});

memoryRouter.post("/ingest", async (req, res) => {
  const payload = req.body ?? {};
  const content = typeof payload.content === "string" ? payload.content : "";
  const metadata = payload.metadata ?? {};

  if (
    !content ||
    typeof metadata.agent_id !== "string" ||
    typeof metadata.project_id !== "string" ||
    typeof metadata.source !== "string"
  ) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "Invalid memory ingest payload", {
        recovery_action: "Provide content and metadata with agent_id, project_id, and source."
      })
    );
  }

  const result = await memoryEventBus.ingest({
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

memoryRouter.post("/pin", async (req, res) => {
  const memoryId = typeof req.body?.memory_id === "string" ? req.body.memory_id.trim() : "";
  if (!memoryId) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "memory_id is required", {
        recovery_action: "Send memory_id of an existing chunk."
      })
    );
  }

  const pinned = await memoryStore.pin(memoryId);
  if (!pinned) {
    return res.status(404).json(
      buildErrorResponse("not_found", "Memory chunk not found", {
        recovery_action: "Search memory first and use a valid memory_id."
      })
    );
  }

  return res.status(200).json({
    memory_id: pinned.id,
    priority_score: pinned.priority_score,
    pinned: true
  });
});

export { memoryRouter };
