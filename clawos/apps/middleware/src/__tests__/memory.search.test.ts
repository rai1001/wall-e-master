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

  it("filters by project_id namespace and applies limit", async () => {
    const ingestOtherProject = await request(app)
      .post("/api/memory/ingest")
      .set("Authorization", "Bearer dev-token")
      .send({
        content: "OpenClaw websocket daemon runs on 127.0.0.1:18789",
        metadata: {
          agent_id: "lince",
          project_id: "proj_002",
          source: "chat",
          tags: ["openclaw"]
        }
      });

    expect(ingestOtherProject.status).toBe(202);

    const scopedSearch = await request(app)
      .get("/api/memory/search?q=openclaw&project_id=proj_001&limit=1")
      .set("Authorization", "Bearer dev-token");

    expect(scopedSearch.status).toBe(200);
    expect(scopedSearch.body.results.length).toBe(1);
    expect(scopedSearch.body.results[0].metadata.project_id).toBe("proj_001");
  });
});
