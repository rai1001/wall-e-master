import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

  it("bootstraps from legacy config files when registry file does not exist", () => {
    const previousAgentsDir = process.env.CLAWOS_AGENTS_DIR;
    const workingDir = mkdtempSync(join(tmpdir(), "clawos-registry-bootstrap-"));
    const legacyAgentDir = join(workingDir, "lince");
    mkdirSync(legacyAgentDir, { recursive: true });

    const legacyConfigPath = join(legacyAgentDir, "lince.config.json");
    writeFileSync(
      legacyConfigPath,
      JSON.stringify(
        {
          id: "legacy_lince",
          name: "Lince",
          role: "Investigador",
          memory_access: "global"
        },
        null,
        2
      ),
      "utf8"
    );

    process.env.CLAWOS_AGENTS_DIR = workingDir;

    try {
      const registry = new AgentRegistry();
      const rows = registry.list();

      expect(rows.length).toBe(1);
      expect(rows[0]?.id).toBe("legacy_lince");
      expect(rows[0]?.status).toBe("idle");
      expect(rows[0]?.memory_access).toBe("global");
      expect(rows[0]?.personality_path).toBe("/souls/lince.md");

      const registryPath = join(workingDir, "agents-registry.json");
      expect(existsSync(registryPath)).toBe(true);
      const saved = JSON.parse(readFileSync(registryPath, "utf8")) as Array<{ id: string }>;
      expect(saved.some((row) => row.id === "legacy_lince")).toBe(true);
    } finally {
      if (previousAgentsDir === undefined) {
        delete process.env.CLAWOS_AGENTS_DIR;
      } else {
        process.env.CLAWOS_AGENTS_DIR = previousAgentsDir;
      }
    }
  });
});
