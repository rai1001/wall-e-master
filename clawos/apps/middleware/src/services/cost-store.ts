import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

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
  private readonly storagePath?: string;
  private readonly projectStates = new Map<string, ProjectCostState>();

  constructor(storagePath?: string) {
    this.storagePath = storagePath;
    const loadedStates = this.loadStates();
    if (loadedStates.length > 0) {
      for (const state of loadedStates) {
        this.projectStates.set(state.project_id, state);
      }
      return;
    }

    const seedState: ProjectCostState = {
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
    };

    this.projectStates.set(seedState.project_id, seedState);
    this.persistStates();
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
    this.persistStates();
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
    this.persistStates();
    return created;
  }

  private resolveStoragePath(): string {
    if (this.storagePath?.trim()) {
      return this.storagePath;
    }

    const explicitPath = process.env.CLAWOS_COSTS_PATH?.trim();
    if (explicitPath) {
      return explicitPath;
    }

    const baseDir = process.env.CLAWOS_COSTS_DIR?.trim() ?? join(process.cwd(), "workspace", "costs");
    return join(baseDir, "cost-store.json");
  }

  private loadStates(): ProjectCostState[] {
    const path = this.resolveStoragePath();
    if (!existsSync(path)) {
      return [];
    }

    try {
      const raw = readFileSync(path, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      const states: ProjectCostState[] = [];
      for (const value of parsed) {
        if (!value || typeof value !== "object") {
          continue;
        }

        const row = value as Record<string, unknown>;
        if (typeof row.project_id !== "string" || typeof row.budget_usd !== "number" || !Array.isArray(row.agents)) {
          continue;
        }

        const agents: AgentCostSummary[] = [];
        for (const agentValue of row.agents) {
          if (!agentValue || typeof agentValue !== "object") {
            continue;
          }

          const agent = agentValue as Record<string, unknown>;
          if (
            typeof agent.agent_id !== "string" ||
            typeof agent.name !== "string" ||
            typeof agent.tokens_in !== "number" ||
            typeof agent.tokens_out !== "number" ||
            typeof agent.estimated_usd !== "number" ||
            typeof agent.last_activity !== "string"
          ) {
            continue;
          }

          agents.push({
            agent_id: agent.agent_id,
            name: agent.name,
            tokens_in: agent.tokens_in,
            tokens_out: agent.tokens_out,
            estimated_usd: agent.estimated_usd,
            last_activity: agent.last_activity
          });
        }

        states.push({
          project_id: row.project_id,
          budget_usd: row.budget_usd,
          agents
        });
      }

      return states;
    } catch {
      return [];
    }
  }

  private persistStates(): void {
    const path = this.resolveStoragePath();
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(Array.from(this.projectStates.values()), null, 2), "utf8");
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
