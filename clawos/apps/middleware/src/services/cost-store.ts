interface AgentCostSummary {
  agent_id: string;
  name: string;
  tokens_in: number;
  tokens_out: number;
  estimated_usd: number;
  last_activity: string;
}

type CostStatus = "within_budget" | "near_limit" | "over_budget";

interface ProjectCostSummary {
  project_id: string;
  spent_usd: number;
  budget_usd: number;
  remaining_usd: number;
  status: CostStatus;
  control_actions: string[];
  agents: AgentCostSummary[];
  updated_at: string;
}

interface ProjectCostState {
  project_id: string;
  budget_usd: number;
  agents: AgentCostSummary[];
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function classifyStatus(spentUsd: number, budgetUsd: number): CostStatus {
  if (spentUsd > budgetUsd) {
    return "over_budget";
  }

  if (spentUsd >= budgetUsd * 0.85) {
    return "near_limit";
  }

  return "within_budget";
}

function buildControlActions(status: CostStatus): string[] {
  if (status === "over_budget") {
    return [
      "Revisar agentes con mayor gasto y pausar los no criticos.",
      "Reducir modelo/voz de alto costo en tareas no urgentes."
    ];
  }

  if (status === "near_limit") {
    return ["Aplicar limite preventivo por agente.", "Programar revision de presupuesto al final del dia."];
  }

  return ["Mantener monitoreo semanal de costo por agente."];
}

class CostStore {
  private readonly projectStates = new Map<string, ProjectCostState>();

  constructor() {
    this.projectStates.set("proj_001", {
      project_id: "proj_001",
      budget_usd: 20,
      agents: [
        {
          agent_id: "lince",
          name: "Lince",
          tokens_in: 11200,
          tokens_out: 6400,
          estimated_usd: 8.35,
          last_activity: new Date().toISOString()
        },
        {
          agent_id: "sastre",
          name: "Sastre",
          tokens_in: 6400,
          tokens_out: 3100,
          estimated_usd: 4.05,
          last_activity: new Date().toISOString()
        }
      ]
    });
  }

  getSummary(projectId: string): ProjectCostSummary {
    const normalizedProjectId = projectId.trim();
    const state = this.getOrCreateState(normalizedProjectId);
    return this.toSummary(state);
  }

  updateBudget(projectId: string, budgetUsd: number): ProjectCostSummary {
    const normalizedProjectId = projectId.trim();
    const state = this.getOrCreateState(normalizedProjectId);
    state.budget_usd = roundCurrency(budgetUsd);
    return this.toSummary(state);
  }

  private getOrCreateState(projectId: string): ProjectCostState {
    const existing = this.projectStates.get(projectId);
    if (existing) {
      return existing;
    }

    const created: ProjectCostState = {
      project_id: projectId,
      budget_usd: 15,
      agents: [
        {
          agent_id: "agent_default",
          name: "Agente Base",
          tokens_in: 0,
          tokens_out: 0,
          estimated_usd: 0,
          last_activity: new Date().toISOString()
        }
      ]
    };
    this.projectStates.set(projectId, created);
    return created;
  }

  private toSummary(state: ProjectCostState): ProjectCostSummary {
    const spentUsd = roundCurrency(state.agents.reduce((acc, row) => acc + row.estimated_usd, 0));
    const budgetUsd = roundCurrency(state.budget_usd);
    const remainingUsd = roundCurrency(budgetUsd - spentUsd);
    const status = classifyStatus(spentUsd, budgetUsd);

    return {
      project_id: state.project_id,
      spent_usd: spentUsd,
      budget_usd: budgetUsd,
      remaining_usd: remainingUsd,
      status,
      control_actions: buildControlActions(status),
      agents: state.agents.map((row) => ({ ...row })),
      updated_at: new Date().toISOString()
    };
  }
}

export { CostStore };
export type { AgentCostSummary, ProjectCostSummary, CostStatus };
