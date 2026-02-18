import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { app } from "../app";

const originalAgentsDir = process.env.CLAWOS_AGENTS_DIR;
const originalPolicy = process.env.CLAWOS_REQUIRE_GLOBAL_MEMORY_APPROVAL;

function restoreEnvironment(): void {
  if (originalAgentsDir === undefined) {
    delete process.env.CLAWOS_AGENTS_DIR;
  } else {
    process.env.CLAWOS_AGENTS_DIR = originalAgentsDir;
  }

  if (originalPolicy === undefined) {
    delete process.env.CLAWOS_REQUIRE_GLOBAL_MEMORY_APPROVAL;
  } else {
    process.env.CLAWOS_REQUIRE_GLOBAL_MEMORY_APPROVAL = originalPolicy;
  }
}

afterEach(() => {
  restoreEnvironment();
});

describe("policy denial for global memory elevation", () => {
  it("returns 403 policy_denied when global memory requires explicit approval header", async () => {
    process.env.CLAWOS_AGENTS_DIR = mkdtempSync(join(tmpdir(), "clawos-policy-denial-"));
    process.env.CLAWOS_REQUIRE_GLOBAL_MEMORY_APPROVAL = "true";

    const spawn = await request(app)
      .post("/api/agents/spawn")
      .set("Authorization", "Bearer dev-token")
      .send({
        name: "Lince",
        role: "Investigador",
        voice_id: "voice_1",
        skills: ["browser"],
        memory_access: "private"
      });

    expect(spawn.status).toBe(201);
    const agentId = String(spawn.body.agent.id);

    const denied = await request(app)
      .patch(`/api/agents/${agentId}/permissions`)
      .set("Authorization", "Bearer dev-token")
      .send({
        skills: ["browser", "python"],
        memory_access: "global"
      });

    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe("policy_denied");
    expect(denied.body.error.details.taxonomy).toBe("policy");
    expect(denied.body.error.details.recovery_action).toContain("x-clawos-global-memory-approved");
  });
});
