import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../app";
import { resetObservabilityStore } from "../services/observability";

describe("observability summary route", () => {
  beforeEach(() => {
    resetObservabilityStore();
  });

  it("returns counters for recent security events and error taxonomies", async () => {
    await request(app).get("/api/projects/status");

    await request(app)
      .post("/api/voice/process")
      .set("Authorization", "Bearer dev-token")
      .send({
        agent_id: "lince",
        project_id: "proj_001",
        audio_base64: Buffer.alloc(600_000).toString("base64")
      });

    const response = await request(app)
      .get("/api/observability/summary?window_minutes=120")
      .set("Authorization", "Bearer dev-token");

    expect(response.status).toBe(200);
    expect(typeof response.body.total_security_events).toBe("number");
    expect(typeof response.body.total_errors).toBe("number");
    expect(Array.isArray(response.body.security_event_counters)).toBe(true);
    expect(Array.isArray(response.body.error_taxonomy_counters)).toBe(true);
    expect(
      response.body.security_event_counters.some(
        (item: { key: string; count: number }) => item.key === "auth_denied" && item.count >= 1
      )
    ).toBe(true);
    expect(
      response.body.error_taxonomy_counters.some(
        (item: { key: string; count: number }) => item.key === "validation" && item.count >= 1
      )
    ).toBe(true);
    expect(typeof response.body.alert_status).toBe("string");
  });
});
