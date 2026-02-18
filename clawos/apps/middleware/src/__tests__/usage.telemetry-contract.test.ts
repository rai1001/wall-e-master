import { describe, expect, it } from "vitest";

import {
  parseUsageTelemetryEnvelope,
  parseUsageTelemetryPayload
} from "../services/usage-telemetry";

describe("usage telemetry contract", () => {
  it("accepts canonical api payload", () => {
    const parsed = parseUsageTelemetryPayload({
      project_id: "proj_001",
      agent_id: "lince",
      agent_name: "Lince",
      tokens_in: 100,
      tokens_out: 40,
      cost_usd: 0.12,
      timestamp: "2026-02-18T15:00:00Z"
    });

    expect(parsed).toEqual({
      project_id: "proj_001",
      agent_id: "lince",
      agent_name: "Lince",
      tokens_in: 100,
      tokens_out: 40,
      cost_usd: 0.12,
      timestamp: "2026-02-18T15:00:00Z"
    });
  });

  it("rejects malformed api payload", () => {
    const parsed = parseUsageTelemetryPayload({
      project_id: "proj_001",
      agent_id: "lince",
      tokens_in: -1,
      tokens_out: 40,
      cost_usd: 0.12
    });

    expect(parsed).toBeNull();
  });

  it("accepts websocket envelope with nested payload aliases", () => {
    const parsed = parseUsageTelemetryEnvelope({
      event_type: "usage_telemetry",
      payload: {
        projectId: "proj_001",
        agentId: "lince",
        agentName: "Lince",
        tokensIn: 120,
        tokensOut: 60,
        costUsd: 0.25
      }
    });

    expect(parsed).toEqual({
      project_id: "proj_001",
      agent_id: "lince",
      agent_name: "Lince",
      tokens_in: 120,
      tokens_out: 60,
      cost_usd: 0.25,
      timestamp: undefined
    });
  });

  it("rejects websocket event when type is unrelated", () => {
    const parsed = parseUsageTelemetryEnvelope({
      type: "heartbeat",
      project_id: "proj_001",
      agent_id: "lince",
      tokens_in: 1,
      tokens_out: 1,
      cost_usd: 0.01
    });

    expect(parsed).toBeNull();
  });
});
