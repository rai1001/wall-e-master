import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("memory ingest route", () => {
  it("queues and persists a chunk with metadata", async () => {
    const ingestPayload = {
      content: "Stripe subscriptions endpoint changed to /v2",
      metadata: {
        agent_id: "lince",
        project_id: "proj_001",
        source: "web",
        tags: ["stripe", "billing"]
      },
      priority_score: 9
    };

    const ingest = await request(app)
      .post("/api/memory/ingest")
      .set("Authorization", "Bearer dev-token")
      .send(ingestPayload);

    expect(ingest.status).toBe(202);
    expect(ingest.body.status).toBe("queued");
    expect(typeof ingest.body.memory_id).toBe("string");

    const search = await request(app)
      .get("/api/memory/search?q=stripe")
      .set("Authorization", "Bearer dev-token");

    expect(search.status).toBe(200);
    expect(search.body.results.some((row: { content: string }) => row.content.includes("Stripe"))).toBe(true);
  });
});
