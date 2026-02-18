import request from "supertest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { app } from "../app";

describe("agents spawn route", () => {
  const previousBaseDir = process.env.CLAWOS_AGENTS_DIR;

  afterEach(() => {
    if (previousBaseDir === undefined) {
      delete process.env.CLAWOS_AGENTS_DIR;
    } else {
      process.env.CLAWOS_AGENTS_DIR = previousBaseDir;
    }
  });

  it("creates an agent and returns 201", async () => {
    process.env.CLAWOS_AGENTS_DIR = mkdtempSync(join(tmpdir(), "clawos-agent-"));

    const payload = {
      name: "Lince",
      role: "Cybersecurity Researcher",
      voice_id: "voice_1",
      skills: ["browser"],
      memory_access: "global"
    };

    const res = await request(app)
      .post("/api/agents/spawn")
      .set("Authorization", "Bearer dev-token")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.agent.name).toBe("Lince");
  });
});
