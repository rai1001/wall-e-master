import { Router } from "express";

import { knowledgeStore } from "../services/knowledge-store";

const knowledgeRouter = Router();

knowledgeRouter.get("/feed", (req, res) => {
  const projectId = String(req.query.project_id ?? "");
  const entries = projectId ? knowledgeStore.getFeed(projectId) : [];

  res.status(200).json({
    project_id: projectId,
    entries
  });
});

knowledgeRouter.get("/graph", (req, res) => {
  const projectId = String(req.query.project_id ?? "");
  const graph = projectId ? knowledgeStore.getGraph(projectId) : { nodes: [], edges: [] };

  res.status(200).json({
    project_id: projectId,
    ...graph
  });
});

export { knowledgeRouter };
