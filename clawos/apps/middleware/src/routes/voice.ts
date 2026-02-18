import { Router } from "express";

import { MockSttProvider } from "../services/stt-provider";
import { MockTtsProvider } from "../services/tts-provider";

const voiceRouter = Router();

const sttProvider = new MockSttProvider();
const ttsProvider = new MockTtsProvider();

voiceRouter.post("/process", async (_req, res) => {
  const transcript = await sttProvider.transcribe(null);
  const ttsAudioUrl = await ttsProvider.synthesize("Current status summary generated");

  res.status(200).json({
    transcript,
    agent_response: "Current status summary generated",
    tts_audio_url: ttsAudioUrl
  });
});

export { voiceRouter };
