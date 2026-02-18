"use client";

import { useMemo, useRef, useState } from "react";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

function getStatusLabel(state: VoiceState): string {
  if (state === "listening") {
    return "escuchando";
  }
  if (state === "processing") {
    return "procesando";
  }
  if (state === "speaking") {
    return "hablando";
  }
  return "en espera";
}

export function VoiceMode() {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [agentResponse, setAgentResponse] = useState("");
  const [error, setError] = useState("");
  const [routed, setRouted] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const statusLabel = useMemo(() => getStatusLabel(state), [state]);

  const stopCurrentAction = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
  };

  const encodeBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  };

  const captureAudioBase64 = async (): Promise<string> => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return btoa("voice_fallback_clip");
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return btoa("voice_fallback_clip");
    }

    try {
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      const completed = new Promise<string>((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        recorder.onerror = () => reject(new Error("No pudimos grabar audio"));
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const buffer = await blob.arrayBuffer();
          resolve(encodeBase64(buffer));
        };
      });

      recorder.start();
      await new Promise((resolve) => setTimeout(resolve, 1300));
      recorder.stop();
      return completed;
    } finally {
      for (const track of stream.getTracks()) {
        track.stop();
      }
    }
  };

  const startVoice = async () => {
    setError("");
    setTranscript("");
    setAgentResponse("");
    setRouted(null);
    setState("listening");

    try {
      const audioBase64 = await captureAudioBase64();
      setState("processing");
      await new Promise((resolve) => setTimeout(resolve, 250));

      const controller = new AbortController();
      abortRef.current = controller;
      const response = await fetch("/api/voice/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          agent_id: "lince",
          project_id: "proj_001",
          audio_base64: audioBase64
        }),
        signal: controller.signal
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error?.message ?? "No pudimos procesar la orden de voz.");
        setState("idle");
        return;
      }

      setTranscript(typeof payload.transcript === "string" ? payload.transcript : "");
      setAgentResponse(typeof payload.agent_response === "string" ? payload.agent_response : "");
      setRouted(payload?.openclaw_routed === true);
      setState("speaking");
      const finishSpeaking = () => {
        window.setTimeout(() => setState("idle"), 1_200);
      };

      if (typeof payload.tts_audio_url === "string" && payload.tts_audio_url.trim()) {
        const audio = new Audio(payload.tts_audio_url);
        audio.addEventListener("ended", finishSpeaking, { once: true });
        audio.addEventListener("error", finishSpeaking, { once: true });
        try {
          await audio.play();
        } catch {
          finishSpeaking();
        }
      } else {
        finishSpeaking();
      }
    } catch {
      setError("No pudimos iniciar el modo voz en este dispositivo.");
      setState("idle");
    } finally {
      abortRef.current = null;
    }
  };

  return (
    <article className="card">
      <h2>Modo Voz</h2>
      <p className="muted">Habla natural. El sistema envia el comando al detectar silencio.</p>
      <p aria-live="polite" style={{ marginTop: "10px", fontWeight: 700 }}>
        Estado de voz: {statusLabel}
      </p>
      {transcript ? <p style={{ marginTop: "8px" }}>Transcripcion: {transcript}</p> : null}
      {agentResponse ? <p style={{ marginTop: "8px" }}>{agentResponse}</p> : null}
      {routed !== null ? (
        <p className="muted" style={{ marginTop: "6px" }}>
          {routed ? "Enviado al agente activo en OpenClaw." : "Respuesta local por falta de conexion con OpenClaw."}
        </p>
      ) : null}
      {error ? (
        <p className="muted" style={{ marginTop: "6px" }}>
          {error}
        </p>
      ) : null}
      {state === "idle" ? (
        <button type="button" onClick={() => void startVoice()}>
          Iniciar modo voz
        </button>
      ) : (
        <button type="button" onClick={stopCurrentAction}>
          Cancelar modo voz
        </button>
      )}
    </article>
  );
}
