import express from "express";

import { authMiddleware } from "./middleware/auth";
import { createRateLimitMiddleware } from "./middleware/rate-limit";
import { requestContextMiddleware, requestLoggerMiddleware } from "./middleware/request-context";
import { agentsRouter } from "./routes/agents";
import { healthRouter } from "./routes/health";
import { handoffRouter } from "./routes/handoff";
import { knowledgeRouter } from "./routes/knowledge";
import { memoryRouter } from "./routes/memory";
import { projectsRouter } from "./routes/projects";
import { costsRouter } from "./routes/costs";
import { securityRouter } from "./routes/security";
import { voiceRouter } from "./routes/voice";

const app = express();

app.use(requestContextMiddleware);
app.use(express.json({ limit: "2mb" }));
app.use(requestLoggerMiddleware);
app.use(healthRouter);
app.use("/api", authMiddleware);
app.use("/api", createRateLimitMiddleware());
app.use("/api/agents", agentsRouter);
app.use("/api/agents", handoffRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/knowledge", knowledgeRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/costs", costsRouter);
app.use("/api/security", securityRouter);
app.use("/api/voice", voiceRouter);

export { app };
