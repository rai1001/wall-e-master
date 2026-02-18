import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("cost summary routes", () => {
  it("returns project cost summary with per-agent breakdown", async () => {
    const response = await request(app)
      .get("/api/costs/summary?project_id=proj_001")
      .set("Authorization", "Bearer dev-token");

    expect(response.status).toBe(200);
    expect(response.body.project_id).toBe("proj_001");
    expect(typeof response.body.spent_usd).toBe("number");
    expect(typeof response.body.budget_usd).toBe("number");
    expect(Array.isArray(response.body.agents)).toBe(true);
    expect(response.body.agents.length).toBeGreaterThan(0);
  });

  it("updates project budget and recalculates control status", async () => {
    const update = await request(app)
      .patch("/api/costs/summary")
      .set("Authorization", "Bearer dev-token")
      .send({
        project_id: "proj_001",
        budget_usd: 10
      });

    expect(update.status).toBe(200);
    expect(update.body.budget_usd).toBe(10);
    expect(update.body.status).toBe("over_budget");
    expect(Array.isArray(update.body.control_actions)).toBe(true);
  });

  it("records usage telemetry and updates per-agent token/cost summary", async () => {
    const projectId = `proj_usage_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const usage = await request(app)
      .post("/api/costs/usage")
      .set("Authorization", "Bearer dev-token")
      .send({
        project_id: projectId,
        agent_id: "lince",
        agent_name: "Lince",
        tokens_in: 1200,
        tokens_out: 800,
        cost_usd: 0.42
      });

    expect(usage.status).toBe(202);
    expect(usage.body.status).toBe("recorded");

    const summary = await request(app)
      .get(`/api/costs/summary?project_id=${encodeURIComponent(projectId)}`)
      .set("Authorization", "Bearer dev-token");

    expect(summary.status).toBe(200);
    expect(summary.body.spent_usd).toBe(0.42);
    const agent = summary.body.agents.find((row: { agent_id: string }) => row.agent_id === "lince");
    expect(agent).toBeDefined();
    expect(agent.tokens_in).toBe(1200);
    expect(agent.tokens_out).toBe(800);
    expect(agent.estimated_usd).toBe(0.42);
  });

  it("rejects malformed usage telemetry payload", async () => {
    const projectId = `proj_usage_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const response = await request(app)
      .post("/api/costs/usage")
      .set("Authorization", "Bearer dev-token")
      .send({
        project_id: projectId,
        agent_id: "lince",
        tokens_in: -1,
        tokens_out: 10,
        cost_usd: 0.01
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
    expect(response.body.error.details.taxonomy).toBe("validation");
  });
});
