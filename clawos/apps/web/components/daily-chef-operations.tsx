"use client";

import Link from "next/link";
import { useState } from "react";

type ActionState = "idle" | "loading" | "success" | "error";

export function DailyChefOperations() {
  const [incident, setIncident] = useState("");
  const [incidentState, setIncidentState] = useState<ActionState>("idle");
  const [incidentMessage, setIncidentMessage] = useState("");
  const [retryState, setRetryState] = useState<ActionState>("idle");
  const [morningDone, setMorningDone] = useState(false);
  const [afternoonDone, setAfternoonDone] = useState(false);

  const saveIncident = async () => {
    setIncidentState("loading");
    setIncidentMessage("Guardando incidencia...");
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (!incident.trim()) {
      setIncidentState("error");
      setIncidentMessage("Escribe una incidencia breve antes de registrar.");
      return;
    }

    setIncidentState("success");
    setIncidentMessage("Incidencia registrada. Quedo lista para seguimiento.");
    setIncident("");
  };

  const retryDeliveries = async () => {
    setRetryState("loading");
    setIncidentMessage("Reintentando envios...");
    await new Promise((resolve) => setTimeout(resolve, 400));
    setRetryState("success");
    setIncidentMessage("Reintento completado. Revisa panel de conexiones para validar canales.");
  };

  return (
    <article className="card">
      <h2>Operacion diaria Chef</h2>
      <p className="muted">Rutina clara para manana, tarde previa e incidencias.</p>
      <ul style={{ marginTop: "10px" }}>
        <li>Manana: revision breve</li>
        <li>Tarde previa: preparar turnos</li>
        <li>Incidencias: registrar + reintentar envios</li>
      </ul>

      <p style={{ marginTop: "12px", marginBottom: "6px", fontWeight: 700 }}>Checklist compacto</p>
      <ul>
        <li>Estado general: verde / amarillo / rojo</li>
        <li>Envio manana: hecho / pendiente</li>
        <li>Envio tarde previa: hecho / pendiente</li>
        <li>Compras: enviado / no aplica</li>
        <li>Incidencias: ninguna / detalle</li>
      </ul>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
        <button type="button" onClick={() => setMorningDone(true)}>
          {morningDone ? "Manana revisada" : "Marcar manana"}
        </button>
        <button type="button" onClick={() => setAfternoonDone(true)}>
          {afternoonDone ? "Tarde preparada" : "Marcar tarde previa"}
        </button>
      </div>

      <label htmlFor="incident-input" style={{ display: "block", marginTop: "12px", fontWeight: 700 }}>
        Incidencia operativa
      </label>
      <input
        id="incident-input"
        value={incident}
        onChange={(event) => setIncident(event.target.value)}
        placeholder="Ejemplo: mensaje de turno no entregado"
        style={{ width: "100%", marginTop: "6px", padding: "8px", borderRadius: "8px", border: "1px solid #d1d5db" }}
      />
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
        <button type="button" onClick={() => void saveIncident()} disabled={incidentState === "loading"}>
          {incidentState === "loading" ? "Guardando..." : "Registrar incidencia"}
        </button>
        <button type="button" onClick={() => void retryDeliveries()} disabled={retryState === "loading"}>
          {retryState === "loading" ? "Reintentando..." : "Reintentar envios"}
        </button>
      </div>

      {incidentMessage ? (
        <p className="muted" style={{ marginTop: "8px" }}>
          {incidentMessage}
        </p>
      ) : null}
      {incidentState === "error" ? (
        <button type="button" onClick={() => void saveIncident()}>
          Reintentar registro
        </button>
      ) : null}

      <div style={{ marginTop: "10px" }}>
        <Link className="action-link" href="/help/03-operacion-diaria-chef">
          Ver guia completa de operacion diaria
        </Link>
      </div>
    </article>
  );
}
