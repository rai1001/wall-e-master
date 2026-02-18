import { describe, expect, it } from "vitest";

import { OpenClawBridge } from "../services/openclaw-bridge";

describe("shared system prompt injection", () => {
  it("includes memory bridge context with project namespace", () => {
    const bridge = new OpenClawBridge({ url: "ws://127.0.0.1:18789" });

    const request = bridge.buildAgentRequest({
      agentName: "Lince",
      projectId: "proj_001",
      allowedTools: ["browser", "python"],
      memoryScope: "project",
      userMessage: "Resume estado del proyecto"
    });

    expect(request.systemPrompt).toContain("project_id: proj_001");
    expect(request.systemPrompt).toContain("allowed_tools: browser, python");
    expect(request.systemPrompt).toContain("memory_scope: project");
    expect(request.systemPrompt).toContain("query shared memory using the active project_id");
  });
});
