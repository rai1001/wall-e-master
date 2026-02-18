import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AgentRegistry } from "../services/agent-registry";

describe("agent registry persistence", () => {
  it("persists registered agents across registry restarts", () => {
    const workingDir = mkdtempSync(join(tmpdir(), "clawos-registry-"));
    const storagePath = join(workingDir, "agents-registry.json");

    const registryA = new AgentRegistry(storagePath);
    registryA.register({
      id: "agent_001",
      name: "Lince",
      role: "Investigador",
      personality_path: "/souls/lince.md",
      voice_id: "voice_1",
      skills: ["browser"],
      memory_access: "private",
      status: "idle"
    });
    registryA.updateStatus("agent_001", "sleeping");
    registryA.updatePermissions("agent_001", ["browser", "python"], "global");

    const registryB = new AgentRegistry(storagePath);
    const rows = registryB.list();

    expect(rows.length).toBe(1);
    expect(rows[0]?.id).toBe("agent_001");
    expect(rows[0]?.status).toBe("sleeping");
    expect(rows[0]?.memory_access).toBe("global");
    expect(rows[0]?.skills).toEqual(["browser", "python"]);
  });
});
