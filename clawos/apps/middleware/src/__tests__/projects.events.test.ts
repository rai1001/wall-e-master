import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("project events route", () => {
  it("returns project event list for valid project_id", async () => {
    const response = await request(app)
      .get("/api/projects/events?project_id=proj_001")
      .set("Authorization", "Bearer dev-token");

    expect(response.status).toBe(200);
    expect(response.body.project_id).toBe("proj_001");
    expect(Array.isArray(response.body.events)).toBe(true);
  });

  it("rejects missing project_id", async () => {
    const response = await request(app)
      .get("/api/projects/events?project_id=")
      .set("Authorization", "Bearer dev-token");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
    expect(response.body.error.details.taxonomy).toBe("validation");
  });
});
