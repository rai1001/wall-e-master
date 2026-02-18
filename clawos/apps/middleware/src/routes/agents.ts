import { Router } from "express";

import { AgentFactory } from "../services/agent-factory";
import { AgentRegistry } from "../services/agent-registry";
import { buildErrorResponse, emitSecurityEvent } from "../services/observability";

const agentsRouter = Router();
const agentFactory = new AgentFactory();
const agentRegistry = new AgentRegistry();

function isGlobalMemoryApprovalRequired(): boolean {
  return process.env.CLAWOS_REQUIRE_GLOBAL_MEMORY_APPROVAL === "true";
}

agentsRouter.post("/spawn", (req, res) => {
  const { name, role, voice_id, skills, memory_access } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof role !== "string" ||
    typeof voice_id !== "string" ||
    !Array.isArray(skills) ||
    (memory_access !== "global" && memory_access !== "private")
  ) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "Invalid spawn payload", {
        recovery_action: "Provide name, role, voice_id, skills[], and memory_access (global|private)."
      })
    );
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
    return res.status(400).json(
      buildErrorResponse("validation_error", "Invalid status value", {
        recovery_action: "Use one of: idle, busy, sleeping."
      })
    );
  }

  const updated = agentRegistry.updateStatus(agentId, status);
  if (!updated) {
    return res.status(404).json(
      buildErrorResponse("not_found", "Agent not found", {
        recovery_action: "List agents and use a valid agentId."
      })
    );
  }

  return res.status(200).json({
    agent: updated
  });
});

agentsRouter.patch("/:agentId/permissions", (req, res) => {
  const { agentId } = req.params;
  const memoryAccess = req.body?.memory_access;
  const skillsInput = req.body?.skills;

  if ((memoryAccess !== "global" && memoryAccess !== "private") || !Array.isArray(skillsInput)) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "Invalid permissions payload", {
        recovery_action: "Provide skills[] and memory_access (global|private)."
      })
    );
  }

  const skills = skillsInput
    .map((value: unknown) => String(value).trim())
    .filter((value: string) => value.length > 0);

  if (skills.length === 0) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "At least one skill is required", {
        recovery_action: "Select one or more skills before saving permissions."
      })
    );
  }

  const approvalHeader = String(req.header("x-clawos-global-memory-approved") ?? "").trim().toLowerCase();
  const globalApprovalGranted = approvalHeader === "true";
  if (isGlobalMemoryApprovalRequired() && memoryAccess === "global" && !globalApprovalGranted) {
    emitSecurityEvent({
      requestId: String(res.locals.request_id ?? "unknown"),
      event: "global_memory_access_denied",
      outcome: "denied",
      details: {
        agent_id: agentId,
        requested_memory_access: memoryAccess,
        approval_header: approvalHeader
      }
    });
    return res.status(403).json(
      buildErrorResponse("policy_denied", "Global memory elevation requires explicit approval.", {
        recovery_action: "Set x-clawos-global-memory-approved: true after approving least-privilege impact."
      })
    );
  }

  const updated = agentRegistry.updatePermissions(agentId, skills, memoryAccess);
  if (!updated) {
    return res.status(404).json(
      buildErrorResponse("not_found", "Agent not found", {
        recovery_action: "List agents and use a valid agentId."
      })
    );
  }

  return res.status(200).json({
    agent: updated
  });
});

export { agentsRouter };
