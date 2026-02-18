import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { app } from "../app";

describe("agent factory files", () => {
  const previousBaseDir = process.env.CLAWOS_AGENTS_DIR;

  afterEach(() => {
    if (previousBaseDir === undefined) {
      delete process.env.CLAWOS_AGENTS_DIR;
    } else {
      process.env.CLAWOS_AGENTS_DIR = previousBaseDir;
    }
  });

  it("creates SOUL identity and context bridge files on spawn", async () => {
    const baseDir = mkdtempSync(join(tmpdir(), "clawos-agent-"));
    process.env.CLAWOS_AGENTS_DIR = baseDir;

    const payload = {
      name: "Lince",
      role: "Cybersecurity Researcher",
      voice_id: "voice_1",
      skills: ["browser", "python"],
      memory_access: "global"
    };

    const res = await request(app)
      .post("/api/agents/spawn")
      .set("Authorization", "Bearer dev-token")
      .send(payload);

    expect(res.status).toBe(201);

    const files = res.body.files_created as string[];
    const soulPath = files.find((item) => item.endsWith("SOUL.md"));
    const identityPath = files.find((item) => item.endsWith("IDENTITY.md"));
    const bridgePath = files.find((item) => item.endsWith("CONTEXT_BRIDGE.md"));

    expect(soulPath).toBeDefined();
    expect(identityPath).toBeDefined();
    expect(bridgePath).toBeDefined();

    const soul = readFileSync(String(soulPath), "utf8");
    const identity = readFileSync(String(identityPath), "utf8");
    const bridge = readFileSync(String(bridgePath), "utf8");

    expect(soul).toContain("Lince");
    expect(identity).toContain("Cybersecurity Researcher");
    expect(bridge).toContain("shared_findings");
  });
});
