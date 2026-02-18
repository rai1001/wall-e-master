import express from "express";

import { agentsRouter } from "./routes/agents";
import { healthRouter } from "./routes/health";
import { memoryRouter } from "./routes/memory";
import { voiceRouter } from "./routes/voice";

const app = express();

app.use(express.json());
app.use(healthRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/voice", voiceRouter);

export { app };
