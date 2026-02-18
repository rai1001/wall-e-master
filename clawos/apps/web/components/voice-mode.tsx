"use client";

import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    if (state === "idle") {
      return;
    }

    if (state === "listening") {
      const timeout = setTimeout(() => setState("processing"), 1200);
      return () => clearTimeout(timeout);
    }

    if (state === "processing") {
      const timeout = setTimeout(() => setState("speaking"), 900);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => setState("idle"), 900);
    return () => clearTimeout(timeout);
  }, [state]);

  const statusLabel = useMemo(() => getStatusLabel(state), [state]);

  return (
    <article className="card">
      <h2>Modo Voz</h2>
      <p className="muted">Habla natural. El sistema envia el comando al detectar silencio.</p>
      <p aria-live="polite" style={{ marginTop: "10px", fontWeight: 700 }}>
        Estado de voz: {statusLabel}
      </p>
      {state === "idle" ? (
        <button type="button" onClick={() => setState("listening")}>
          Iniciar modo voz
        </button>
      ) : (
        <button type="button" onClick={() => setState("idle")}>
          Cancelar modo voz
        </button>
      )}
    </article>
  );
}
