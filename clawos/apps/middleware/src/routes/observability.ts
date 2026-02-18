import { Router } from "express";

import { buildErrorResponse, getObservabilitySummary } from "../services/observability";

const observabilityRouter = Router();

observabilityRouter.get("/summary", (req, res) => {
  const rawWindow = Number(req.query.window_minutes ?? 60);
  if (!Number.isFinite(rawWindow) || rawWindow <= 0) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "window_minutes must be a positive number", {
        recovery_action: "Send window_minutes as an integer between 1 and 1440."
      })
    );
  }

  const windowMinutes = Math.floor(rawWindow);
  const summary = getObservabilitySummary(windowMinutes);
  return res.status(200).json(summary);
});

export { observabilityRouter };
