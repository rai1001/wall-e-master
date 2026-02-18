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

interface PermissionDraft {
  browser: boolean;
  terminal: boolean;
  python: boolean;
  memoryAccess: "global" | "private";
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAgentId, setPendingAgentId] = useState("");
  const [editingAgentId, setEditingAgentId] = useState("");
  const [permissionDraft, setPermissionDraft] = useState<PermissionDraft | null>(null);

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

  const startEditingPermissions = (agent: Agent) => {
    setEditingAgentId(agent.id);
    setPermissionDraft({
      browser: agent.skills.includes("browser"),
      terminal: agent.skills.includes("terminal"),
      python: agent.skills.includes("python"),
      memoryAccess: agent.memory_access
    });
  };

  const savePermissions = async (agent: Agent) => {
    if (!permissionDraft) {
      return;
    }

    const nextSkills = [
      permissionDraft.browser ? "browser" : "",
      permissionDraft.terminal ? "terminal" : "",
      permissionDraft.python ? "python" : ""
    ].filter((value) => value.length > 0);

    if (nextSkills.length === 0) {
      setError("Activa al menos una habilidad para guardar permisos.");
      return;
    }

    setPendingAgentId(agent.id);
    setError("");

    try {
      const response = await fetch(`/api/agents/${encodeURIComponent(agent.id)}/permissions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          skills: nextSkills,
          memory_access: permissionDraft.memoryAccess
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error?.message ?? "No se pudieron guardar los permisos.");
        return;
      }

      setAgents((prev) =>
        prev.map((row) =>
          row.id === agent.id
            ? {
                ...row,
                skills: payload.agent.skills as string[],
                memory_access: payload.agent.memory_access as "global" | "private"
              }
            : row
        )
      );
      setEditingAgentId("");
      setPermissionDraft(null);
    } catch {
      setError("No se pudieron guardar los permisos.");
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
                <button
                  type="button"
                  onClick={() => startEditingPermissions(agent)}
                  disabled={pendingAgentId === agent.id}
                  style={{ marginLeft: "8px" }}
                >
                  {`Editar permisos ${agent.name}`}
                </button>

                {editingAgentId === agent.id && permissionDraft ? (
                  <section style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
                    <label>
                      <input
                        type="checkbox"
                        aria-label={`Permisos ${agent.name} Browser`}
                        checked={permissionDraft.browser}
                        onChange={(event) =>
                          setPermissionDraft((prev) => (prev ? { ...prev, browser: event.target.checked } : prev))
                        }
                      />{" "}
                      Browser
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        aria-label={`Permisos ${agent.name} Terminal`}
                        checked={permissionDraft.terminal}
                        onChange={(event) =>
                          setPermissionDraft((prev) => (prev ? { ...prev, terminal: event.target.checked } : prev))
                        }
                      />{" "}
                      Terminal
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        aria-label={`Permisos ${agent.name} Python`}
                        checked={permissionDraft.python}
                        onChange={(event) =>
                          setPermissionDraft((prev) => (prev ? { ...prev, python: event.target.checked } : prev))
                        }
                      />{" "}
                      Python
                    </label>
                    <label htmlFor={`memory-${agent.id}`}>{`Memoria ${agent.name}`}</label>
                    <select
                      id={`memory-${agent.id}`}
                      aria-label={`Memoria ${agent.name}`}
                      value={permissionDraft.memoryAccess}
                      onChange={(event) =>
                        setPermissionDraft((prev) =>
                          prev ? { ...prev, memoryAccess: event.target.value as "global" | "private" } : prev
                        )
                      }
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #d1d5db" }}
                    >
                      <option value="private">private</option>
                      <option value="global">global</option>
                    </select>
                    <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                      <button
                        type="button"
                        onClick={() => savePermissions(agent)}
                        disabled={pendingAgentId === agent.id}
                      >
                        {`Guardar permisos ${agent.name}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAgentId("");
                          setPermissionDraft(null);
                        }}
                        disabled={pendingAgentId === agent.id}
                      >
                        Cancelar
                      </button>
                    </div>
                  </section>
                ) : null}
              </article>
            );
          })}
        </div>
      </article>
    </section>
  );
}
