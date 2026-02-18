import { Router } from "express";

import { AgentFactory } from "../services/agent-factory";

const agentsRouter = Router();
const agentFactory = new AgentFactory();

agentsRouter.post("/spawn", (req, res) => {
  const { name, role, voice_id, skills, memory_access } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof role !== "string" ||
    typeof voice_id !== "string" ||
    !Array.isArray(skills) ||
    (memory_access !== "global" && memory_access !== "private")
  ) {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "Invalid spawn payload",
        details: {}
      }
    });
  }

  const result = agentFactory.spawn({
    name,
    role,
    voice_id,
    skills: skills.map((value) => String(value)),
    memory_access
  });

  return res.status(201).json(result);
});

export { agentsRouter };
