import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

describe("observability persistence", () => {
  it("keeps counters after module restart when persistence is enabled", async () => {
    const previousPath = process.env.CLAWOS_OBSERVABILITY_PATH;
    const workDir = mkdtempSync(join(tmpdir(), "clawos-observability-"));
    const storagePath = join(workDir, "counters.json");
    process.env.CLAWOS_OBSERVABILITY_PATH = storagePath;

    try {
      const observabilityA = await import("../services/observability");
      observabilityA.resetObservabilityStore();

      observabilityA.emitSecurityEvent({
        requestId: "req-1",
        event: "auth_denied",
        outcome: "denied"
      });
      observabilityA.buildErrorResponse("rate_limited", "Too many requests");

      const firstSummary = observabilityA.getObservabilitySummary(60);
      expect(firstSummary.total_security_events).toBeGreaterThanOrEqual(1);
      expect(firstSummary.total_errors).toBeGreaterThanOrEqual(1);

      vi.resetModules();
      const observabilityB = await import("../services/observability");
      const secondSummary = observabilityB.getObservabilitySummary(60);

      expect(secondSummary.total_security_events).toBeGreaterThanOrEqual(1);
      expect(secondSummary.total_errors).toBeGreaterThanOrEqual(1);
    } finally {
      if (previousPath === undefined) {
        delete process.env.CLAWOS_OBSERVABILITY_PATH;
      } else {
        process.env.CLAWOS_OBSERVABILITY_PATH = previousPath;
      }

      rmSync(workDir, { recursive: true, force: true });
      vi.resetModules();
    }
  });
});
