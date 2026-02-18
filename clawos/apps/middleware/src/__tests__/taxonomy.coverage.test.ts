import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("taxonomy coverage", () => {
  it("returns taxonomy details for validation failures across routes", async () => {
    const spawn = await request(app)
      .post("/api/agents/spawn")
      .set("Authorization", "Bearer dev-token")
      .send({});

    expect(spawn.status).toBe(400);
    expect(spawn.body.error.code).toBe("validation_error");
    expect(spawn.body.error.details.taxonomy).toBe("validation");

    const handoff = await request(app)
      .post("/api/agents/handoff")
      .set("Authorization", "Bearer dev-token")
      .send({});

    expect(handoff.status).toBe(400);
    expect(handoff.body.error.code).toBe("validation_error");
    expect(handoff.body.error.details.taxonomy).toBe("validation");

    const feed = await request(app)
      .get("/api/knowledge/feed")
      .set("Authorization", "Bearer dev-token");

    expect(feed.status).toBe(400);
    expect(feed.body.error.code).toBe("validation_error");
    expect(feed.body.error.details.taxonomy).toBe("validation");

    const projects = await request(app)
      .get("/api/projects/status?project_id=")
      .set("Authorization", "Bearer dev-token");

    expect(projects.status).toBe(400);
    expect(projects.body.error.code).toBe("validation_error");
    expect(projects.body.error.details.taxonomy).toBe("validation");
  });
});
