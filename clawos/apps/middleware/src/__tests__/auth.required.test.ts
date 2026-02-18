import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("auth required", () => {
  it("rejects protected endpoint without token", async () => {
    const res = await request(app).get("/api/projects/status?project_id=proj_001");
    expect(res.status).toBe(401);
  });
});
