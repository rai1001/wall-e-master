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
});
