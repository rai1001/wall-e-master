import { Router } from "express";

import { AgentFactory } from "../services/agent-factory";
import { AgentRegistry } from "../services/agent-registry";

const agentsRouter = Router();
const agentFactory = new AgentFactory();
const agentRegistry = new AgentRegistry();

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

  agentRegistry.register(result.agent);

  return res.status(201).json(result);
});

agentsRouter.get("/", (_req, res) => {
  return res.status(200).json({
    agents: agentRegistry.list()
  });
});

agentsRouter.patch("/:agentId/status", (req, res) => {
  const { agentId } = req.params;
  const status = req.body?.status;

  if (status !== "idle" && status !== "busy" && status !== "sleeping") {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "Invalid status value",
        details: {}
      }
    });
  }

  const updated = agentRegistry.updateStatus(agentId, status);
  if (!updated) {
    return res.status(404).json({
      error: {
        code: "not_found",
        message: "Agent not found",
        details: {}
      }
    });
  }

  return res.status(200).json({
    agent: updated
  });
});

export { agentsRouter };
