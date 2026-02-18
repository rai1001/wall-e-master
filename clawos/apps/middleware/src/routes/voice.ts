import { Router } from "express";

import { buildErrorResponse } from "../services/observability";
import { AgentRegistry } from "../services/agent-registry";
import { OpenClawBridge } from "../services/openclaw-bridge";
import { createSttProviderFromEnv } from "../services/stt-provider";
import { createTtsProviderFromEnv } from "../services/tts-provider";
import { VoiceAudioStore } from "../services/voice-audio-store";

const voiceRouter = Router();
const MAX_AUDIO_BYTES = 512_000;
const voiceAudioStore = new VoiceAudioStore();
const agentRegistry = new AgentRegistry();
const openClawBridge = new OpenClawBridge({
  url: process.env.OPENCLAW_WS_URL ?? "ws://127.0.0.1:18789",
  reconnectAttempts: 2,
  connectTimeoutMs: 700
});

voiceRouter.post("/process", async (req, res) => {
  const payload = req.body ?? {};
  const audioBase64 = typeof payload.audio_base64 === "string" ? payload.audio_base64.trim() : "";
  const agentId = typeof payload.agent_id === "string" ? payload.agent_id.trim() : "";
  const projectId = typeof payload.project_id === "string" && payload.project_id.trim() ? payload.project_id.trim() : "proj_001";
  const voiceId = typeof payload.voice_id === "string" ? payload.voice_id.trim() : "";

  if (!audioBase64 || !agentId) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "audio_base64 and agent_id are required", {
        recovery_action: "Attach voice audio and select the active agent, then retry."
      })
    );
  }

  let audioBuffer = Buffer.alloc(0);
  try {
    audioBuffer = Buffer.from(audioBase64, "base64");
  } catch {
    return res.status(400).json(
      buildErrorResponse("validation_error", "audio_base64 must be valid base64", {
        recovery_action: "Record audio again and submit a valid clip."
      })
    );
  }

  if (audioBuffer.length === 0) {
    return res.status(400).json(
      buildErrorResponse("validation_error", "audio clip is empty", {
        recovery_action: "Record at least one second of audio and retry."
      })
    );
  }

  if (audioBuffer.length > MAX_AUDIO_BYTES) {
    return res.status(413).json(
      buildErrorResponse("payload_too_large", "Audio payload exceeds maximum size", {
        limit_bytes: MAX_AUDIO_BYTES,
        recovery_action: "Send a shorter audio clip or reduce audio quality."
      })
    );
  }

  let sttProvider;
  let ttsProvider;
  try {
    sttProvider = createSttProviderFromEnv();
    ttsProvider = createTtsProviderFromEnv();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice provider configuration is invalid.";
    return res.status(503).json(
      buildErrorResponse("provider_configuration_error", "Voice providers are not configured correctly", {
        recovery_action: message
      })
    );
  }

  try {
    const transcript = await sttProvider.transcribe(audioBuffer);
    const knownAgent = agentRegistry.list().find((agent) => agent.id === agentId);
    const agentName = knownAgent?.name ?? agentId;
    const memoryScope = knownAgent?.memory_access === "global" ? "global" : "project";
    const allowedTools = knownAgent?.skills ?? [];

    const bridgeResult = await openClawBridge.requestAgentResponse({
      agentId,
      agentName,
      projectId,
      allowedTools,
      memoryScope,
      userMessage: transcript
    });

    const agentResponse = bridgeResult.response;
    const synthesis = await ttsProvider.synthesize(agentResponse, {
      voiceId
    });
    const stored = voiceAudioStore.saveMp3(synthesis.audioBuffer);

    return res.status(200).json({
      transcript,
      agent_response: agentResponse,
      tts_audio_url: stored.url,
      openclaw_routed: bridgeResult.delivered
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice provider request failed.";
    return res.status(502).json(
      buildErrorResponse("provider_runtime_error", "Voice processing failed at external provider", {
        recovery_action: message
      })
    );
  }
});

voiceRouter.get("/output/:fileName", (req, res) => {
  const fileName = String(req.params.fileName ?? "");
  const audio = voiceAudioStore.readMp3(fileName);
  if (!audio) {
    return res.status(404).json(
      buildErrorResponse("not_found", "Voice output file not found", {
        recovery_action: "Generate a new voice response and retry."
      })
    );
  }

  res.setHeader("Content-Type", "audio/mpeg");
  return res.status(200).send(audio);
});

export { voiceRouter };
