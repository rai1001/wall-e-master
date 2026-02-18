"use client";

import { useEffect, useMemo, useState } from "react";

type IntegrationStatus = "connected" | "review" | "disconnected";

interface IntegrationRow {
  id: string;
  label: string;
  status: IntegrationStatus;
  mock_ready: boolean;
  last_checked_at: string;
  message: string;
}

interface IntegrationsStatusResponse {
  generated_at: string;
  integrations: IntegrationRow[];
}

interface IntegrationTestResponse {
  integration: {
    id: string;
    status: IntegrationStatus;
    checked_at: string;
    result: string;
  };
}

function statusLabel(status: IntegrationStatus): string {
  if (status === "connected") {
    return "conectado";
  }
  if (status === "review") {
    return "revisar";
  }
  return "desconectado";
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("es-ES", {
    hour12: false
  });
}

export function OperationalConnectionsPanel() {
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [resultsById, setResultsById] = useState<Record<string, string>>({});

  const canRetry = useMemo(() => error.trim().length > 0, [error]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/integrations/status", {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as IntegrationsStatusResponse;
      if (!response.ok) {
        setError("No pudimos cargar conexiones operativas. Reintenta en unos segundos.");
        return;
      }

      setIntegrations(Array.isArray(payload.integrations) ? payload.integrations : []);
    } catch {
      setError("No pudimos cargar conexiones operativas. Reintenta en unos segundos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runTest = async (integrationId: string) => {
    setTestingId(integrationId);
    setResultsById((prev) => ({
      ...prev,
      [integrationId]: "Probando..."
    }));

    try {
      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          integration_id: integrationId
        })
      });
      const payload = (await response.json()) as IntegrationTestResponse;

      if (!response.ok) {
        const message = (payload as unknown as { error?: { message?: string } })?.error?.message;
        setResultsById((prev) => ({
          ...prev,
          [integrationId]: message ?? "La prueba no se pudo completar. Reintenta."
        }));
        return;
      }

      setResultsById((prev) => ({
        ...prev,
        [integrationId]: payload.integration.result
      }));
      await load();
    } catch {
      setResultsById((prev) => ({
        ...prev,
        [integrationId]: "La prueba no se pudo completar. Reintenta."
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <article className="card">
      <h2>Conexiones operativas</h2>
      <p className="muted">Control rapido de WhatsApp, Email, Make y ChefOs para operacion diaria.</p>
      {loading ? <p>Cargando conexiones...</p> : null}
      {error ? <p className="muted">{error}</p> : null}
      {canRetry ? (
        <button type="button" onClick={() => void load()}>
          Reintentar
        </button>
      ) : null}
      {!loading && !error && integrations.length === 0 ? (
        <p className="muted">Sin conexiones registradas por ahora.</p>
      ) : null}
      {!loading && !error && integrations.length > 0 ? (
        <ul style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "grid", gap: "10px" }}>
          {integrations.map((integration) => (
            <li key={integration.id} style={{ border: "1px solid #d1d5db", borderRadius: "10px", padding: "10px" }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{integration.label}</p>
              <p className="muted" style={{ margin: "0 0 4px" }}>
                Estado: {statusLabel(integration.status)}
              </p>
              <p className="muted" style={{ margin: "0 0 4px" }}>
                Ultimo chequeo: {formatDate(integration.last_checked_at)}
              </p>
              <p className="muted" style={{ margin: "0 0 8px" }}>
                {integration.message}
              </p>
              <button type="button" onClick={() => void runTest(integration.id)} disabled={testingId === integration.id}>
                {testingId === integration.id ? "Probando..." : "Probar"}
              </button>
              {resultsById[integration.id] ? (
                <p className="muted" style={{ marginTop: "8px" }}>
                  {resultsById[integration.id]}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
