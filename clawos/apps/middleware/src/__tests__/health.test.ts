import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("health routes", () => {
  it("returns liveness and readiness", async () => {
    const live = await request(app).get("/health/live");
    const ready = await request(app).get("/health/ready");

    expect(live.status).toBe(200);
    expect(ready.status).toBe(200);
  });
});
