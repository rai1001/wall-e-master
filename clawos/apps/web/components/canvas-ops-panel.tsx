"use client";

import { useState } from "react";

type CanvasState = "idle" | "loading" | "success" | "error";

interface CanvasStatusResponse {
  available: boolean;
  message: string;
  url?: string | null;
}

export function CanvasOpsPanel() {
  const [state, setState] = useState<CanvasState>("idle");
  const [message, setMessage] = useState("");
  const [canvasUrl, setCanvasUrl] = useState<string>("");

  const openCanvasView = async () => {
    setState("loading");
    setMessage("Comprobando disponibilidad de Canvas...");

    try {
      const response = await fetch("/api/canvas/status", {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as CanvasStatusResponse;
      if (!response.ok) {
        setState("error");
        setMessage("No pudimos validar Canvas. Sigue con la vista web normal.");
        return;
      }

      if (!payload.available) {
        setState("success");
        setCanvasUrl("");
        setMessage(payload.message);
        return;
      }

      setState("success");
      setCanvasUrl(typeof payload.url === "string" ? payload.url : "");
      setMessage(payload.message || "Canvas disponible.");
    } catch {
      setState("error");
      setMessage("No pudimos validar Canvas. Sigue con la vista web normal.");
    }
  };

  return (
    <article className="card">
      <h2>Vista Canvas (opcional)</h2>
      <p className="muted">Usala solo si esta disponible. Si no, continuas en esta vista sin interrupciones.</p>
      <button type="button" onClick={() => void openCanvasView()} disabled={state === "loading"}>
        {state === "loading" ? "Comprobando..." : "Abrir vista Canvas"}
      </button>
      {message ? (
        <p className="muted" style={{ marginTop: "8px" }}>
          {message}
        </p>
      ) : null}
      {canvasUrl ? (
        <a className="action-link" href={canvasUrl} target="_blank" rel="noreferrer" style={{ marginTop: "8px" }}>
          Abrir Canvas en nueva pestaña
        </a>
      ) : null}
      {state === "error" ? (
        <button type="button" onClick={() => void openCanvasView()}>
          Reintentar
        </button>
      ) : null}
    </article>
  );
}
