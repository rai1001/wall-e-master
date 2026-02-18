import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("memory search route", () => {
  it("returns ranked semantic results", async () => {
    const res = await request(app)
      .get("/api/memory/search?q=react")
      .set("Authorization", "Bearer dev-token");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
  });
});
