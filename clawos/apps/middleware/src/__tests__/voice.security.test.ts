import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { app } from "../app";

const originalLimit = process.env.API_RATE_LIMIT_MAX;
const originalWindow = process.env.API_RATE_LIMIT_WINDOW_MS;

afterEach(() => {
  if (originalLimit === undefined) {
    delete process.env.API_RATE_LIMIT_MAX;
  } else {
    process.env.API_RATE_LIMIT_MAX = originalLimit;
  }

  if (originalWindow === undefined) {
    delete process.env.API_RATE_LIMIT_WINDOW_MS;
  } else {
    process.env.API_RATE_LIMIT_WINDOW_MS = originalWindow;
  }
});

describe("voice and api security controls", () => {
  it("rejects oversized audio payload with actionable guidance", async () => {
    const oversizedAudio = Buffer.alloc(600_000, 1).toString("base64");
    const response = await request(app)
      .post("/api/voice/process")
      .set("Authorization", "Bearer dev-token")
      .send({
        agent_id: "lince",
        project_id: "proj_001",
        audio_base64: oversizedAudio
      });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("payload_too_large");
    expect(response.body.error.details.recovery_action).toContain("audio");
  });

  it("returns a request id header for traceability", async () => {
    const response = await request(app)
      .get("/api/projects/status?project_id=proj_001")
      .set("Authorization", "Bearer dev-token");

    expect(response.status).toBe(200);
    expect(typeof response.headers["x-request-id"]).toBe("string");
    expect(response.headers["x-request-id"].length).toBeGreaterThan(8);
  });

  it("enforces rate limiting with a 429 response", async () => {
    process.env.API_RATE_LIMIT_MAX = "3";
    process.env.API_RATE_LIMIT_WINDOW_MS = "60000";

    const calls = [];
    for (let index = 0; index < 4; index += 1) {
      calls.push(
        await request(app)
          .get("/api/projects/status?project_id=proj_001")
          .set("Authorization", "Bearer dev-token")
          .set("X-Rate-Limit-Key", "voice-security-test")
      );
    }

    expect(calls[3]?.status).toBe(429);
    expect(calls[3]?.body.error.code).toBe("rate_limited");
  });
});
