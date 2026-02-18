"use client";

import { useEffect, useState } from "react";

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

export default function SecurityPage() {
  const [status, setStatus] = useState<SecurityChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/security/checklist", { method: "GET", cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload?.error?.message ?? "No se pudo cargar el checklist de seguridad.");
          return;
        }

        setStatus(payload as SecurityChecklistResponse);
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
    </section>
  );
}
