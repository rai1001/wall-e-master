import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { app } from "../app";

const originalSttProvider = process.env.STT_PROVIDER;
const originalTtsProvider = process.env.TTS_PROVIDER;
const originalOpenAiKey = process.env.OPENAI_API_KEY;
const originalElevenLabsKey = process.env.ELEVENLABS_API_KEY;

function restoreEnvironment(): void {
  if (originalSttProvider === undefined) {
    delete process.env.STT_PROVIDER;
  } else {
    process.env.STT_PROVIDER = originalSttProvider;
  }

  if (originalTtsProvider === undefined) {
    delete process.env.TTS_PROVIDER;
  } else {
    process.env.TTS_PROVIDER = originalTtsProvider;
  }

  if (originalOpenAiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiKey;
  }

  if (originalElevenLabsKey === undefined) {
    delete process.env.ELEVENLABS_API_KEY;
  } else {
    process.env.ELEVENLABS_API_KEY = originalElevenLabsKey;
  }
}

afterEach(() => {
  restoreEnvironment();
});

describe("voice provider configuration", () => {
  it("returns 503 with actionable message when STT provider is configured without OPENAI_API_KEY", async () => {
    process.env.STT_PROVIDER = "openai";
    process.env.TTS_PROVIDER = "mock";
    delete process.env.OPENAI_API_KEY;

    const audioBase64 = Buffer.from("hello clawos").toString("base64");
    const response = await request(app)
      .post("/api/voice/process")
      .set("Authorization", "Bearer dev-token")
      .send({
        agent_id: "lince",
        project_id: "proj_001",
        audio_base64: audioBase64
      });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("provider_configuration_error");
    expect(response.body.error.details.recovery_action).toContain("OPENAI_API_KEY");
  });

  it("returns 503 with actionable message when TTS provider is configured without ELEVENLABS_API_KEY", async () => {
    process.env.STT_PROVIDER = "mock";
    process.env.TTS_PROVIDER = "elevenlabs";
    delete process.env.ELEVENLABS_API_KEY;

    const audioBase64 = Buffer.from("hello clawos").toString("base64");
    const response = await request(app)
      .post("/api/voice/process")
      .set("Authorization", "Bearer dev-token")
      .send({
        agent_id: "lince",
        project_id: "proj_001",
        audio_base64: audioBase64
      });

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("provider_configuration_error");
    expect(response.body.error.details.recovery_action).toContain("ELEVENLABS_API_KEY");
  });
});
