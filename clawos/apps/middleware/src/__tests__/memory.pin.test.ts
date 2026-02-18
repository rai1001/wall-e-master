import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("memory pin route", () => {
  it("pins an existing memory chunk and returns updated priority", async () => {
    const ingest = await request(app)
      .post("/api/memory/ingest")
      .set("Authorization", "Bearer dev-token")
      .send({
        content: "OpenClaw daemon moved behind middleware security boundary",
        metadata: {
          agent_id: "lince",
          project_id: "proj_001",
          source: "chat",
          tags: ["security", "openclaw"]
        },
        priority_score: 6
      });

    expect(ingest.status).toBe(202);
    const memoryId = String(ingest.body.memory_id);

    const pin = await request(app)
      .post("/api/memory/pin")
      .set("Authorization", "Bearer dev-token")
      .send({
        memory_id: memoryId,
        reason: "critical platform dependency"
      });

    expect(pin.status).toBe(200);
    expect(pin.body.memory_id).toBe(memoryId);
    expect(pin.body.pinned).toBe(true);
    expect(typeof pin.body.priority_score).toBe("number");
    expect(pin.body.priority_score).toBeGreaterThanOrEqual(7);
  });

  it("returns 404 when memory chunk does not exist", async () => {
    const pin = await request(app)
      .post("/api/memory/pin")
      .set("Authorization", "Bearer dev-token")
      .send({
        memory_id: "mem_missing",
        reason: "important"
      });

    expect(pin.status).toBe(404);
    expect(pin.body.error.code).toBe("not_found");
  });
});
