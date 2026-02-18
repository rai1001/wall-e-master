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

interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
}

interface KnowledgeGraphEdge {
  from: string;
  to: string;
  relation: string;
}

interface KnowledgeGraphResponse {
  project_id: string;
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

interface KnowledgeFeedEntry {
  id: string;
  agent_id: string;
  message: string;
  timestamp: string;
}

interface KnowledgeFeedResponse {
  project_id: string;
  entries: KnowledgeFeedEntry[];
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function buildAgentClusters(graph: KnowledgeGraphResponse | null): Array<{ agentLabel: string; findings: number }> {
  if (!graph) {
    return [];
  }

  const nodeById = new Map<string, KnowledgeGraphNode>();
  for (const node of graph.nodes) {
    nodeById.set(node.id, node);
  }

  const counts = new Map<string, number>();
  for (const edge of graph.edges) {
    if (edge.relation !== "hands_off") {
      continue;
    }

    const fromNode = nodeById.get(edge.from);
    const toNode = nodeById.get(edge.to);
    if (!fromNode || !toNode || fromNode.type !== "agent" || toNode.type !== "finding") {
      continue;
    }

    counts.set(fromNode.label, (counts.get(fromNode.label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([agentLabel, findings]) => ({ agentLabel, findings }))
    .sort((a, b) => b.findings - a.findings || a.agentLabel.localeCompare(b.agentLabel));
}

export default function ProjectsPage() {
  const [status, setStatus] = useState<ProjectStatusResponse | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummaryResponse | null>(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraphResponse | null>(null);
  const [knowledgeFeed, setKnowledgeFeed] = useState<KnowledgeFeedEntry[]>([]);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [error, setError] = useState<string>("");
  const [costError, setCostError] = useState<string>("");
  const [knowledgeError, setKnowledgeError] = useState<string>("");
  const [feedError, setFeedError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [budgetUpdating, setBudgetUpdating] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      let projectId = "proj_001";

      try {
        const response = await fetch(`/api/projects/status?project_id=${encodeURIComponent(projectId)}`, {
          method: "GET",
          cache: "no-store"
        });

        const payload = await response.json();
        if (!active) {
          return;
        }
        if (!response.ok) {
          setError(payload?.error?.message ?? "No pudimos cargar el estado del proyecto.");
          return;
        }

        const projectStatus = payload as ProjectStatusResponse;
        setStatus(projectStatus);
        projectId = projectStatus.project_id || projectId;
      } catch {
        if (active) {
          setError("No pudimos cargar el estado del proyecto.");
        }
      }

      try {
        const costResponse = await fetch(`/api/costs/summary?project_id=${encodeURIComponent(projectId)}`, {
          method: "GET",
          cache: "no-store"
        });
        const costPayload = await costResponse.json();
        if (!active) {
          return;
        }
        if (!costResponse.ok) {
          setCostError(costPayload?.error?.message ?? "No pudimos cargar el resumen de costos.");
        } else {
          const summary = costPayload as CostSummaryResponse;
          setCostSummary(summary);
          setBudgetDraft(String(summary.budget_usd));
        }
      } catch {
        if (active) {
          setCostError("No pudimos cargar el resumen de costos.");
        }
      }

      try {
        const graphResponse = await fetch(`/api/knowledge/graph?project_id=${encodeURIComponent(projectId)}`, {
          method: "GET",
          cache: "no-store"
        });
        const graphPayload = await graphResponse.json();
        if (!active) {
          return;
        }
        if (!graphResponse.ok) {
          setKnowledgeError(graphPayload?.error?.message ?? "No pudimos cargar el mapa de conocimiento.");
        } else {
          setKnowledgeGraph(graphPayload as KnowledgeGraphResponse);
        }
      } catch {
        if (active) {
          setKnowledgeError("No pudimos cargar el mapa de conocimiento.");
        }
      }

      try {
        const feedResponse = await fetch(`/api/knowledge/feed?project_id=${encodeURIComponent(projectId)}`, {
          method: "GET",
          cache: "no-store"
        });
        const feedPayload = await feedResponse.json();
        if (!active) {
          return;
        }
        if (!feedResponse.ok) {
          setFeedError(feedPayload?.error?.message ?? "No pudimos cargar el feed global.");
        } else {
          const feed = feedPayload as KnowledgeFeedResponse;
          setKnowledgeFeed(Array.isArray(feed.entries) ? feed.entries : []);
        }
      } catch {
        if (active) {
          setFeedError("No pudimos cargar el feed global.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 5_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
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

  const agentNodeCount = knowledgeGraph ? knowledgeGraph.nodes.filter((node) => node.type === "agent").length : 0;
  const findingNodeCount = knowledgeGraph ? knowledgeGraph.nodes.filter((node) => node.type === "finding").length : 0;
  const clusters = buildAgentClusters(knowledgeGraph);

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
      <article className="card">
        <h2>Mapa de Conocimiento</h2>
        <p className="muted">Resumen simple de como fluye la informacion entre agentes.</p>
        {loading ? <p>Cargando mapa...</p> : null}
        {knowledgeError ? <p className="muted">{knowledgeError}</p> : null}
        {knowledgeGraph ? (
          <>
            <p>Agentes en el mapa: {agentNodeCount}</p>
            <p>Hallazgos conectados: {findingNodeCount}</p>
            {clusters.length > 0 ? (
              <ul>
                {clusters.map((cluster) => (
                  <li key={cluster.agentLabel}>
                    {cluster.agentLabel}: {cluster.findings} hallazgos compartidos
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Aun no hay handoffs registrados para este proyecto.</p>
            )}
          </>
        ) : null}
      </article>
      <article className="card">
        <h2>Feed Global de Hallazgos</h2>
        <p className="muted">Lo ultimo que descubrieron tus agentes en lenguaje simple.</p>
        {loading ? <p>Cargando feed...</p> : null}
        {feedError ? <p className="muted">{feedError}</p> : null}
        {knowledgeFeed.length > 0 ? (
          <ul>
            {knowledgeFeed.slice(0, 6).map((entry) => (
              <li key={entry.id}>
                {entry.message}
                <span className="muted"> ({entry.agent_id})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Aun no hay hallazgos compartidos para este proyecto.</p>
        )}
      </article>
    </section>
  );
}
