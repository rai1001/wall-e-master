import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../app";

describe("voice process route", () => {
  it("processes audio and returns transcript plus tts output", async () => {
    const res = await request(app).post("/api/voice/process");

    expect(res.status).toBe(200);
    expect(res.body.transcript).toBeDefined();
    expect(res.body.tts_audio_url).toBeDefined();
  });
});
