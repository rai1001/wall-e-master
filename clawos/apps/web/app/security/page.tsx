"use client";

import { useEffect, useState } from "react";

import { OperationalConnectionsPanel } from "../../components/operational-connections";

type CheckStatus = "pass" | "warn";

interface SecurityCheck {
  id: string;
  status: CheckStatus;
  message: string;
  recovery_action: string;
}

interface SecurityChecklistResponse {
  overall_status: string;
  remote_access: {
    provider: string;
    public_url?: string;
  };
  checks: SecurityCheck[];
  helper_commands: {
    tailscale: string[];
    cloudflare: string[];
  };
}

interface CounterSummary {
  key: string;
  count: number;
}

interface ObservabilitySummaryResponse {
  generated_at: string;
  window_minutes: number;
  total_security_events: number;
  total_errors: number;
  security_event_counters: CounterSummary[];
  error_taxonomy_counters: CounterSummary[];
  alert_status: "nominal" | "watch" | "critical";
  alerts: string[];
}

export default function SecurityPage() {
  const [status, setStatus] = useState<SecurityChecklistResponse | null>(null);
  const [observability, setObservability] = useState<ObservabilitySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [observabilityError, setObservabilityError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/security/checklist", { method: "GET", cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload?.error?.message ?? "No se pudo cargar el checklist de seguridad.");
        } else {
          setStatus(payload as SecurityChecklistResponse);
        }

        const observabilityResponse = await fetch("/api/observability/summary?window_minutes=60", {
          method: "GET",
          cache: "no-store"
        });
        const observabilityPayload = await observabilityResponse.json();
        if (!observabilityResponse.ok) {
          setObservabilityError(observabilityPayload?.error?.message ?? "No se pudo cargar el panel de observabilidad.");
        } else {
          setObservability(observabilityPayload as ObservabilitySummaryResponse);
        }
      } catch {
        setError("No se pudo cargar el checklist de seguridad.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <section className="grid">
      <OperationalConnectionsPanel />
      <article className="card">
        <h2>Checklist de Seguridad Remota</h2>
        <p className="muted">Verificacion automatica para acceso fuera de casa con Tailscale/Cloudflare.</p>
        {loading ? <p>Cargando checklist...</p> : null}
        {error ? <p className="muted">{error}</p> : null}
        {status ? (
          <>
            <p>Estado general: {status.overall_status}</p>
            <p>Proveedor remoto activo: {status.remote_access.provider}</p>
            <p>URL remota: {status.remote_access.public_url ?? "sin configurar"}</p>
            <ul style={{ marginTop: "10px" }}>
              {status.checks.map((item) => (
                <li key={item.id} style={{ marginBottom: "8px" }}>
                  <strong>{item.status}</strong> - {item.message}
                  <div className="muted">{item.recovery_action}</div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </article>

      <article className="card">
        <h2>Comandos Guiados</h2>
        <p className="muted">Copia y ejecuta solo el proveedor que uses.</p>
        <h3 style={{ marginBottom: "8px" }}>Tailscale</h3>
        {status?.helper_commands.tailscale.map((command) => (
          <pre
            key={command}
            style={{
              margin: "0 0 8px",
              padding: "8px",
              borderRadius: "8px",
              background: "#f3f4f6",
              overflowX: "auto"
            }}
          >
            <code>{command}</code>
          </pre>
        ))}
        <h3 style={{ marginBottom: "8px", marginTop: "12px" }}>Cloudflare</h3>
        {status?.helper_commands.cloudflare.map((command) => (
          <pre
            key={command}
            style={{
              margin: "0 0 8px",
              padding: "8px",
              borderRadius: "8px",
              background: "#f3f4f6",
              overflowX: "auto"
            }}
          >
            <code>{command}</code>
          </pre>
        ))}
      </article>

      <article className="card">
        <h2>Panel de Observabilidad</h2>
        <p className="muted">Contadores de alerta para deteccion temprana de problemas operativos.</p>
        {loading ? <p>Cargando observabilidad...</p> : null}
        {observabilityError ? <p className="muted">{observabilityError}</p> : null}
        {observability ? (
          <>
            <p>Alert status: {observability.alert_status}</p>
            <p>Eventos de seguridad: {observability.total_security_events}</p>
            <p>Errores clasificados: {observability.total_errors}</p>
            {observability.alerts.length > 0 ? (
              <>
                <p style={{ marginBottom: "6px", fontWeight: 700 }}>Alertas activas</p>
                <ul>
                  {observability.alerts.map((alert) => (
                    <li key={alert}>{alert}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted">Sin alertas activas en la ventana actual.</p>
            )}
            <p style={{ marginBottom: "6px", fontWeight: 700 }}>Eventos de seguridad</p>
            <ul>
              {observability.security_event_counters.map((item) => (
                <li key={item.key}>
                  {item.key}: {item.count}
                </li>
              ))}
            </ul>
            <p style={{ marginBottom: "6px", fontWeight: 700 }}>Taxonomia de errores</p>
            <ul>
              {observability.error_taxonomy_counters.map((item) => (
                <li key={item.key}>
                  {item.key}: {item.count}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </article>
    </section>
  );
}
