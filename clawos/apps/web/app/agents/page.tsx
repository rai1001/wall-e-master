"use client";

import { useEffect, useState } from "react";

type AgentStatus = "idle" | "busy" | "sleeping";

interface Agent {
  id: string;
  name: string;
  role: string;
  memory_access: "global" | "private";
  status: AgentStatus;
  skills: string[];
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAgentId, setPendingAgentId] = useState("");

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await fetch("/api/agents", { method: "GET", cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          setError(payload?.error?.message ?? "No se pudo cargar la lista de agentes.");
          return;
        }

        setAgents(Array.isArray(payload.agents) ? (payload.agents as Agent[]) : []);
      } catch {
        setError("No se pudo cargar la lista de agentes.");
      } finally {
        setLoading(false);
      }
    };

    void loadAgents();
  }, []);

  const updateStatus = async (agent: Agent, nextStatus: AgentStatus) => {
    setPendingAgentId(agent.id);
    setError("");

    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(agent.id)}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error?.message ?? "No se pudo actualizar el estado del agente.");
        return;
      }

      setAgents((prev) =>
        prev.map((row) =>
          row.id === agent.id
            ? {
                ...row,
                status: payload.agent.status as AgentStatus
              }
            : row
        )
      );
    } catch {
      setError("No se pudo actualizar el estado del agente.");
    } finally {
      setPendingAgentId("");
    }
  };

  return (
    <section className="grid">
      <article className="card">
        <h2>Gestion de Agentes</h2>
        <p className="muted">Consulta estado y controla pausa/reanudacion sin tocar configuracion tecnica.</p>

        {loading ? <p>Cargando agentes...</p> : null}
        {error ? <p className="muted">{error}</p> : null}
        {!loading && agents.length === 0 ? (
          <p className="muted">No hay agentes todavia. Crea uno desde "Crear Agente".</p>
        ) : null}

        <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
          {agents.map((agent) => {
            const sleepAction = agent.status === "sleeping" ? "idle" : "sleeping";
            const label = agent.status === "sleeping" ? `Despertar ${agent.name}` : `Dormir ${agent.name}`;

            return (
              <article
                key={agent.id}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "10px",
                  background: "#ffffff"
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {agent.name}: {agent.status}
                </p>
                <p className="muted" style={{ margin: "4px 0 8px" }}>
                  {agent.role} | memoria {agent.memory_access} | skills: {agent.skills.join(", ")}
                </p>
                <button
                  type="button"
                  onClick={() => updateStatus(agent, sleepAction)}
                  disabled={pendingAgentId === agent.id}
                >
                  {pendingAgentId === agent.id ? "Actualizando..." : label}
                </button>
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}
