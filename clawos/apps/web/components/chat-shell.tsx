"use client";

import { useState } from "react";

interface MemorySearchResult {
  id: string;
  content: string;
  metadata: {
    agent_id: string;
    source: string;
  };
}

export function ChatShell() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Esperando comando.");
  const [results, setResults] = useState<MemorySearchResult[]>([]);
  const [error, setError] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinningId, setPinningId] = useState("");

  const onSearch = async () => {
    const normalized = query.trim();
    if (!normalized) {
      return;
    }

    setLoading(true);
    setError("");
    setPinMessage("");
    setStatus("Buscando contexto en memoria compartida...");

    try {
      const response = await fetch(`/api/memory/search?q=${encodeURIComponent(normalized)}&project_id=proj_001`, {
        method: "GET"
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? "No pudimos procesar tu consulta.");
        setResults([]);
        setStatus("No se pudo completar la busqueda.");
        return;
      }

      const rows = Array.isArray(payload.results) ? (payload.results as MemorySearchResult[]) : [];
      setResults(rows);
      setStatus(rows.length > 0 ? "Contexto listo para el agente activo." : "No encontramos coincidencias en memoria.");
    } catch {
      setError("No pudimos conectar con la memoria del sistema.");
      setStatus("Sin conexion al middleware.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onPin = async (memoryId: string) => {
    setPinningId(memoryId);
    setPinMessage("");

    try {
      const response = await fetch("/api/memory/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          memory_id: memoryId,
          reason: "Pinned from chat control panel"
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setPinMessage(payload?.error?.message ?? "No pudimos fijar el recuerdo seleccionado.");
        return;
      }

      setPinMessage("Memoria fijada en contexto global.");
    } catch {
      setPinMessage("No pudimos fijar la memoria por falta de conexion.");
    } finally {
      setPinningId("");
    }
  };

  return (
    <section className="card">
      <h2>Chat de Control</h2>
      <p className="muted">Escribe una orden simple. Ejemplo: "Lince, revisa el estado del proyecto".</p>
      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
        <input
          aria-label="Comando"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ejemplo: estado del proyecto"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid #d1d5db"
          }}
        />
        <button type="button" onClick={onSearch} disabled={loading}>
          {loading ? "Buscando..." : "Buscar contexto"}
        </button>
      </div>
      <div
        style={{
          marginTop: "12px",
          padding: "12px",
          borderRadius: "10px",
          border: "1px dashed #9ca3af",
          background: "#f9fafb"
        }}
      >
        <strong>Estado:</strong> {status}
      </div>
      {error ? (
        <p className="muted" style={{ marginTop: "8px" }}>
          {error}
        </p>
      ) : null}
      {pinMessage ? (
        <p className="muted" style={{ marginTop: "8px" }}>
          {pinMessage}
        </p>
      ) : null}
      {results.length > 0 ? (
        <ul style={{ marginTop: "10px" }}>
          {results.map((item) => (
            <li key={item.id}>
              {item.content} ({item.metadata.agent_id} / {item.metadata.source}){" "}
              <button
                type="button"
                aria-label={`Fijar en memoria global ${item.id}`}
                onClick={() => onPin(item.id)}
                disabled={pinningId === item.id}
                style={{ marginLeft: "8px" }}
              >
                {pinningId === item.id ? "Fijando..." : "Fijar en memoria global"}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
