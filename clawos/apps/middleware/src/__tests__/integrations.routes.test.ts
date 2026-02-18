import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("integrations routes", () => {
  it("returns operational integrations status with non-technical hints", async () => {
    const response = await request(app).get("/api/integrations/status").set("Authorization", "Bearer dev-token");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.integrations)).toBe(true);
    expect(response.body.integrations).toHaveLength(4);
    expect(response.body.integrations[0]).toMatchObject({
      id: expect.any(String),
      label: expect.any(String),
      status: expect.any(String),
      mock_ready: expect.any(Boolean),
      last_checked_at: expect.any(String),
      message: expect.any(String)
    });
  });

  it("runs a test check for one integration", async () => {
    const response = await request(app)
      .post("/api/integrations/test")
      .set("Authorization", "Bearer dev-token")
      .send({ integration_id: "email" });

    expect(response.status).toBe(200);
    expect(response.body.integration.id).toBe("email");
    expect(response.body.integration.result).toBeDefined();
  });

  it("rejects unsupported integration id", async () => {
    const response = await request(app)
      .post("/api/integrations/test")
      .set("Authorization", "Bearer dev-token")
      .send({ integration_id: "unknown-service" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
    expect(response.body.error.details.taxonomy).toBe("validation");
  });
});
