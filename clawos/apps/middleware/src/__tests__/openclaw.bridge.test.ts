import { describe, expect, it } from "vitest";

import { OpenClawBridge } from "../services/openclaw-bridge";

describe("openclaw bridge", () => {
  it("reconnects after websocket disconnect", async () => {
    const bridge = new OpenClawBridge({ url: "ws://127.0.0.1:18789" });
    const state = await bridge.simulateDisconnectAndRecover();

    expect(state.recovered).toBe(true);
    expect(state.attempts).toBeGreaterThan(0);
  });
});
