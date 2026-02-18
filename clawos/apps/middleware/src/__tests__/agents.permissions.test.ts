import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("agents permissions route", () => {
  it("updates skills and memory access for an existing agent", async () => {
    process.env.CLAWOS_AGENTS_DIR = mkdtempSync(join(tmpdir(), "clawos-agent-permissions-"));

    const spawn = await request(app)
      .post("/api/agents/spawn")
      .set("Authorization", "Bearer dev-token")
      .send({
        name: "Sastre",
        role: "Programador",
        voice_id: "voice_code",
        skills: ["terminal"],
        memory_access: "private"
      });

    expect(spawn.status).toBe(201);
    const agentId = String(spawn.body.agent.id);

    const update = await request(app)
      .patch(`/api/agents/${agentId}/permissions`)
      .set("Authorization", "Bearer dev-token")
      .send({
        skills: ["browser", "python"],
        memory_access: "global"
      });

    expect(update.status).toBe(200);
    expect(update.body.agent.memory_access).toBe("global");
    expect(update.body.agent.skills).toEqual(["browser", "python"]);
  });
});
