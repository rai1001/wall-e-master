import { Router } from "express";

import { knowledgeStore } from "../services/knowledge-store";
import { buildErrorResponse } from "../services/observability";

const knowledgeRouter = Router();

knowledgeRouter.get("/feed", (req, res) => {
  const projectId = String(req.query.project_id ?? "").trim();
  if (!projectId) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "project_id is required", {
        recovery_action: "Send project_id query parameter to load feed entries."
      })
    );
  }

  const entries = knowledgeStore.getFeed(projectId);

  return res.status(200).json({
    project_id: projectId,
    entries
  });
});

knowledgeRouter.get("/graph", (req, res) => {
  const projectId = String(req.query.project_id ?? "").trim();
  if (!projectId) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "project_id is required", {
        recovery_action: "Send project_id query parameter to load graph data."
      })
    );
  }

  const graph = knowledgeStore.getGraph(projectId);

  return res.status(200).json({
    project_id: projectId,
    ...graph
  });
});

export { knowledgeRouter };
