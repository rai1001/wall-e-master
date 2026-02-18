"use client";

import { useEffect, useState } from "react";

interface ProjectStatusResponse {
  project_id: string;
  overall_status: string;
  agents: Array<{ id: string; name: string; status: string }>;
  tasks: {
    todo: number;
    doing: number;
    done: number;
  };
  updated_at: string;
}

interface AgentCostSummary {
  agent_id: string;
  name: string;
  tokens_in: number;
  tokens_out: number;
  estimated_usd: number;
  last_activity: string;
}

interface CostSummaryResponse {
  project_id: string;
  spent_usd: number;
  budget_usd: number;
  remaining_usd: number;
  status: "within_budget" | "near_limit" | "over_budget";
  control_actions: string[];
  agents: AgentCostSummary[];
  updated_at: string;
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function ProjectsPage() {
  const [status, setStatus] = useState<ProjectStatusResponse | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummaryResponse | null>(null);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [error, setError] = useState<string>("");
  const [costError, setCostError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [budgetUpdating, setBudgetUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/projects/status?project_id=proj_001", {
          method: "GET",
          cache: "no-store"
        });

        const payload = await response.json();
        if (!response.ok) {
          setError(payload?.error?.message ?? "No pudimos cargar el estado del proyecto.");
          return;
        }

        setStatus(payload as ProjectStatusResponse);

        const costResponse = await fetch("/api/costs/summary?project_id=proj_001", {
          method: "GET",
          cache: "no-store"
        });
        const costPayload = await costResponse.json();
        if (!costResponse.ok) {
          setCostError(costPayload?.error?.message ?? "No pudimos cargar el resumen de costos.");
          return;
        }

        const summary = costPayload as CostSummaryResponse;
        setCostSummary(summary);
        setBudgetDraft(String(summary.budget_usd));
      } catch {
        setError("No pudimos cargar el estado del proyecto.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const updateBudget = async () => {
    const numericBudget = Number(budgetDraft);
    if (!Number.isFinite(numericBudget) || numericBudget <= 0) {
      setCostError("Ingresa un presupuesto valido mayor a 0.");
      return;
    }

    setBudgetUpdating(true);
    setCostError("");
    try {
      const response = await fetch("/api/costs/summary", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project_id: status?.project_id ?? "proj_001",
          budget_usd: numericBudget
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setCostError(payload?.error?.message ?? "No se pudo actualizar el presupuesto.");
        return;
      }

      const summary = payload as CostSummaryResponse;
      setCostSummary(summary);
      setBudgetDraft(String(summary.budget_usd));
    } catch {
      setCostError("No se pudo actualizar el presupuesto.");
    } finally {
      setBudgetUpdating(false);
    }
  };

  return (
    <section className="grid">
      <article className="card">
        <h2>Kanban de Proyecto</h2>
        <p className="muted">Vista en tiempo real del proyecto activo.</p>
        {loading ? <p>Cargando estado...</p> : null}
        {error ? <p className="muted">{error}</p> : null}
        {status ? (
          <>
            <p>Por hacer: {status.tasks.todo}</p>
            <p>En progreso: {status.tasks.doing}</p>
            <p>Completado: {status.tasks.done}</p>
          </>
        ) : null}
      </article>
      <article className="card">
        <h2>Timeline</h2>
        <p className="muted">Actividad actual de agentes conectados.</p>
        {status ? (
          <ul>
            {status.agents.map((agent) => (
              <li key={agent.id}>
                {agent.name}: {agent.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Sin datos de agentes por ahora.</p>
        )}
      </article>
      <article className="card">
        <h2>Control de Costos</h2>
        <p className="muted">Monitorea gasto estimado y ajusta presupuesto sin configuracion avanzada.</p>
        {loading ? <p>Cargando costos...</p> : null}
        {costError ? <p className="muted">{costError}</p> : null}
        {costSummary ? (
          <>
            <p>Gasto estimado: {formatUsd(costSummary.spent_usd)}</p>
            <p>Presupuesto: {formatUsd(costSummary.budget_usd)}</p>
            <p>Disponible: {formatUsd(costSummary.remaining_usd)}</p>
            <p>Estado de control: {costSummary.status}</p>
            <label htmlFor="project-budget-input">Presupuesto del proyecto (USD)</label>
            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <input
                id="project-budget-input"
                aria-label="Presupuesto del proyecto (USD)"
                value={budgetDraft}
                onChange={(event) => setBudgetDraft(event.target.value)}
                style={{ padding: "8px", borderRadius: "8px", border: "1px solid #d1d5db", width: "140px" }}
              />
              <button type="button" onClick={updateBudget} disabled={budgetUpdating}>
                {budgetUpdating ? "Actualizando..." : "Actualizar presupuesto"}
              </button>
            </div>
            <p style={{ marginTop: "10px", marginBottom: "6px", fontWeight: 700 }}>Gasto por agente</p>
            <ul>
              {costSummary.agents.map((agent) => (
                <li key={agent.agent_id}>
                  {agent.name}: {formatUsd(agent.estimated_usd)}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </article>
    </section>
  );
}
