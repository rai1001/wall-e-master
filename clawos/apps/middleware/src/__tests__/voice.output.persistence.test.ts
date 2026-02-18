import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { app } from "../app";

const previousVoiceDir = process.env.CLAWOS_VOICE_OUTPUT_DIR;

afterEach(() => {
  if (previousVoiceDir === undefined) {
    delete process.env.CLAWOS_VOICE_OUTPUT_DIR;
  } else {
    process.env.CLAWOS_VOICE_OUTPUT_DIR = previousVoiceDir;
  }
});

describe("voice output persistence", () => {
  it("stores synthesized audio on disk and serves it via output route", async () => {
    const workingDir = mkdtempSync(join(tmpdir(), "clawos-voice-output-"));
    process.env.CLAWOS_VOICE_OUTPUT_DIR = workingDir;

    try {
      const response = await request(app)
        .post("/api/voice/process")
        .set("Authorization", "Bearer dev-token")
        .send({
          agent_id: "lince",
          project_id: "proj_001",
          audio_base64: Buffer.from("hello clawos").toString("base64")
        });

      expect(response.status).toBe(200);
      expect(typeof response.body.tts_audio_url).toBe("string");
      expect(response.body.tts_audio_url).toMatch(/^\/api\/voice\/output\/.+\.mp3$/);

      const fetchAudio = await request(app)
        .get(String(response.body.tts_audio_url))
        .set("Authorization", "Bearer dev-token");

      expect(fetchAudio.status).toBe(200);
      expect(fetchAudio.headers["content-type"]).toContain("audio/mpeg");
      expect(fetchAudio.body.length).toBeGreaterThan(0);
    } finally {
      rmSync(workingDir, { recursive: true, force: true });
    }
  });
});
