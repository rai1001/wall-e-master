import { Router } from "express";

const projectsRouter = Router();

projectsRouter.get("/status", (req, res) => {
  const projectId = String(req.query.project_id ?? "proj_001");

  res.status(200).json({
    project_id: projectId,
    overall_status: "in_progress",
    agents: [
      { id: "a1", name: "Lince", status: "busy" },
      { id: "a2", name: "Sastre", status: "idle" }
    ],
    tasks: {
      todo: 12,
      doing: 4,
      done: 18
    },
    updated_at: new Date().toISOString()
  });
});

export { projectsRouter };
