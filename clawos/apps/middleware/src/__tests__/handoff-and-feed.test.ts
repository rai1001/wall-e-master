import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("handoff and knowledge routes", () => {
  it("transfers handoff and exposes feed and graph", async () => {
    const handoff = await request(app)
      .post("/api/agents/handoff")
      .set("Authorization", "Bearer dev-token")
      .send({
        from_agent_id: "lince",
        to_agent_id: "sastre",
        project_id: "proj_001",
        content: "Update websocket connector with reconnect backoff"
      });

    expect(handoff.status).toBe(200);
    expect(handoff.body.status).toBe("transferred");
    expect(typeof handoff.body.handoff_id).toBe("string");

    const feed = await request(app)
      .get("/api/knowledge/feed?project_id=proj_001")
      .set("Authorization", "Bearer dev-token");

    expect(feed.status).toBe(200);
    expect(Array.isArray(feed.body.entries)).toBe(true);
    expect(feed.body.entries.length).toBeGreaterThan(0);

    const graph = await request(app)
      .get("/api/knowledge/graph?project_id=proj_001")
      .set("Authorization", "Bearer dev-token");

    expect(graph.status).toBe(200);
    expect(Array.isArray(graph.body.nodes)).toBe(true);
    expect(Array.isArray(graph.body.edges)).toBe(true);
  });
});
