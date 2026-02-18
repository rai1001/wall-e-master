import { WebSocketServer } from "ws";
import { describe, expect, it } from "vitest";

import { OpenClawBridge } from "../services/openclaw-bridge";

describe("openclaw bridge", () => {
  it("connects to a real websocket server and recovers after disconnect", async () => {
    const wss = new WebSocketServer({ port: 0 });
    const address = wss.address();
    if (!address || typeof address === "string") {
      throw new Error("Unable to resolve test websocket port");
    }

    const bridge = new OpenClawBridge({
      url: `ws://127.0.0.1:${address.port}`,
      reconnectAttempts: 3
    });

    try {
      const initial = await bridge.ensureConnected();
      expect(initial).toBe(true);

      const state = await bridge.simulateDisconnectAndRecover();
      expect(state.recovered).toBe(true);
      expect(state.attempts).toBeGreaterThan(0);
    } finally {
      bridge.disconnect();
      await new Promise<void>((resolve) => wss.close(() => resolve()));
    }
  });
});
