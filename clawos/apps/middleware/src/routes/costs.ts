import { Router } from "express";

import { costStore } from "../services/cost-store-singleton";
import { buildErrorResponse, emitSecurityEvent } from "../services/observability";
import { parseUsageTelemetryPayload } from "../services/usage-telemetry";

const costsRouter = Router();

costsRouter.get("/summary", (req, res) => {
  const projectId = String(req.query.project_id ?? "proj_001").trim();
  if (!projectId) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "project_id is required", {
        recovery_action: "Send a valid project_id query parameter."
      })
    );
  }

  const summary = costStore.getSummary(projectId);
  if (summary.status === "over_budget") {
    emitSecurityEvent({
      requestId: String(res.locals.request_id ?? "unknown"),
      event: "project_budget_overrun",
      outcome: "warning",
      details: {
        project_id: projectId,
        spent_usd: summary.spent_usd,
        budget_usd: summary.budget_usd
      }
    });
  }

  return res.status(200).json(summary);
});

costsRouter.patch("/summary", (req, res) => {
  const projectId = typeof req.body?.project_id === "string" ? req.body.project_id.trim() : "";
  const budgetUsd = req.body?.budget_usd;

  if (!projectId || typeof budgetUsd !== "number" || !Number.isFinite(budgetUsd) || budgetUsd <= 0) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "Invalid budget payload", {
        recovery_action: "Send project_id plus budget_usd (> 0)."
      })
    );
  }

  const summary = costStore.updateBudget(projectId, budgetUsd);
  if (summary.status === "over_budget") {
    emitSecurityEvent({
      requestId: String(res.locals.request_id ?? "unknown"),
      event: "project_budget_overrun",
      outcome: "warning",
      details: {
        project_id: projectId,
        spent_usd: summary.spent_usd,
        budget_usd: summary.budget_usd
      }
    });
  }

  return res.status(200).json(summary);
});

costsRouter.post("/usage", (req, res) => {
  const usage = parseUsageTelemetryPayload(req.body);

  if (!usage) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "Invalid usage telemetry payload", {
        recovery_action: "Send project_id, agent_id, tokens_in, tokens_out, and cost_usd with non-negative numeric values."
      })
    );
  }

  const summary = costStore.recordUsage(usage.project_id, {
    agent_id: usage.agent_id,
    agent_name: usage.agent_name,
    tokens_in: usage.tokens_in,
    tokens_out: usage.tokens_out,
    cost_usd: usage.cost_usd,
    timestamp: usage.timestamp
  });

  if (summary.status === "over_budget") {
    emitSecurityEvent({
      requestId: String(res.locals.request_id ?? "unknown"),
      event: "project_budget_overrun",
      outcome: "warning",
      details: {
        project_id: projectId,
        spent_usd: summary.spent_usd,
        budget_usd: summary.budget_usd
      }
    });
  }

  return res.status(202).json({
    status: "recorded",
    summary
  });
});

export { costsRouter };
