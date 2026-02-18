import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("agents management routes", () => {
  it("lists agents and updates status to sleeping and back to idle", async () => {
    process.env.CLAWOS_AGENTS_DIR = mkdtempSync(join(tmpdir(), "clawos-agent-management-"));

    const spawnPayload = {
      name: "Guardia",
      role: "Security Monitor",
      voice_id: "voice_guard",
      skills: ["browser", "terminal"],
      memory_access: "private"
    };

    const spawn = await request(app)
      .post("/api/agents/spawn")
      .set("Authorization", "Bearer dev-token")
      .send(spawnPayload);

    expect(spawn.status).toBe(201);
    const agentId = String(spawn.body.agent.id);

    const list = await request(app).get("/api/agents").set("Authorization", "Bearer dev-token");

    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.agents)).toBe(true);
    expect(list.body.agents.some((row: { id: string }) => row.id === agentId)).toBe(true);

    const sleep = await request(app)
      .patch(`/api/agents/${agentId}/status`)
      .set("Authorization", "Bearer dev-token")
      .send({ status: "sleeping" });

    expect(sleep.status).toBe(200);
    expect(sleep.body.agent.status).toBe("sleeping");

    const wake = await request(app)
      .patch(`/api/agents/${agentId}/status`)
      .set("Authorization", "Bearer dev-token")
      .send({ status: "idle" });

    expect(wake.status).toBe(200);
    expect(wake.body.agent.status).toBe("idle");
  });
});
