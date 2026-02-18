import { Router } from "express";

import { MockSttProvider } from "../services/stt-provider";
import { MockTtsProvider } from "../services/tts-provider";

const voiceRouter = Router();
const MAX_AUDIO_BYTES = 512_000;

const sttProvider = new MockSttProvider();
const ttsProvider = new MockTtsProvider();

voiceRouter.post("/process", async (req, res) => {
  const payload = req.body ?? {};
  const audioBase64 = typeof payload.audio_base64 === "string" ? payload.audio_base64.trim() : "";
  const agentId = typeof payload.agent_id === "string" ? payload.agent_id.trim() : "";

  if (!audioBase64 || !agentId) {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "audio_base64 and agent_id are required",
        details: {
          recovery_action: "Attach voice audio and select the active agent, then retry."
        }
      }
    });
  }

  let audioBuffer = Buffer.alloc(0);
  try {
    audioBuffer = Buffer.from(audioBase64, "base64");
  } catch {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "audio_base64 must be valid base64",
        details: {
          recovery_action: "Record audio again and submit a valid clip."
        }
      }
    });
  }

  if (audioBuffer.length === 0) {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "audio clip is empty",
        details: {
          recovery_action: "Record at least one second of audio and retry."
        }
      }
    });
  }

  if (audioBuffer.length > MAX_AUDIO_BYTES) {
    return res.status(413).json({
      error: {
        code: "payload_too_large",
        message: "Audio payload exceeds maximum size",
        details: {
          limit_bytes: MAX_AUDIO_BYTES,
          recovery_action: "Send a shorter audio clip or reduce audio quality."
        }
      }
    });
  }

  const transcript = await sttProvider.transcribe(audioBuffer);
  const ttsAudioUrl = await ttsProvider.synthesize("Current status summary generated");

  return res.status(200).json({
    transcript,
    agent_response: "Current status summary generated",
    tts_audio_url: ttsAudioUrl
  });
});

export { voiceRouter };
