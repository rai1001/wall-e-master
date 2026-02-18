import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/health/live", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

healthRouter.get("/health/ready", (_req, res) => {
  res.status(200).json({ status: "ready" });
});

export { healthRouter };
