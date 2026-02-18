import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("agents spawn route", () => {
  it("creates an agent and returns 201", async () => {
    const payload = {
      name: "Lince",
      role: "Cybersecurity Researcher",
      voice_id: "voice_1",
      skills: ["browser"],
      memory_access: "global"
    };

    const res = await request(app).post("/api/agents/spawn").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.agent.name).toBe("Lince");
  });
});
