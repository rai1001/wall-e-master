import { Router } from "express";

import { AgentRegistry } from "../services/agent-registry";
import { buildErrorResponse } from "../services/observability";
import { OpenClawBridge } from "../services/openclaw-bridge";

const projectsRouter = Router();
const agentRegistry = new AgentRegistry();
const openClawBridge = new OpenClawBridge({
  url: process.env.OPENCLAW_WS_URL ?? "ws://127.0.0.1:18789",
  reconnectAttempts: 3,
  connectTimeoutMs: 700
});

projectsRouter.get("/status", async (req, res) => {
  const rawProjectId = String(req.query.project_id ?? "proj_001").trim();
  if (!rawProjectId) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "project_id is required", {
        recovery_action: "Send project_id query parameter to load project status."
      })
    );
  }

  const shouldProbe = String(req.query.probe ?? "")
    .trim()
    .toLowerCase();
  if (shouldProbe === "true") {
    await openClawBridge.ensureConnected();
  }

  const agents = agentRegistry.list();
  const responseAgents =
    agents.length > 0
      ? agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          status: agent.status
        }))
      : [
          { id: "a1", name: "Lince", status: "busy" },
          { id: "a2", name: "Sastre", status: "idle" }
        ];

  return res.status(200).json({
    project_id: rawProjectId,
    overall_status: "in_progress",
    agents: responseAgents,
    tasks: {
      todo: 12,
      doing: 4,
      done: 18
    },
    bridge: {
      ws_url: openClawBridge.getUrl(),
      connected: openClawBridge.isConnected()
    },
    updated_at: new Date().toISOString()
  });
});

export { projectsRouter };
