import { randomUUID } from "node:crypto";

interface HandoffEvent {
  id: string;
  project_id: string;
  from_agent_id: string;
  to_agent_id: string;
  content: string;
  timestamp: string;
}

class KnowledgeStore {
  private readonly handoffs: HandoffEvent[] = [];

  addHandoff(input: Omit<HandoffEvent, "id" | "timestamp">): HandoffEvent {
    const event: HandoffEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...input
    };

    this.handoffs.push(event);
    return event;
  }

  getFeed(projectId: string): HandoffEvent[] {
    return this.handoffs.filter((event) => event.project_id === projectId);
  }

  getGraph(projectId: string): { nodes: Array<Record<string, string>>; edges: Array<Record<string, string>> } {
    const events = this.getFeed(projectId);
    const nodeMap = new Map<string, Record<string, string>>();
    const edges: Array<Record<string, string>> = [];

    for (const event of events) {
      const fromId = `agent:${event.from_agent_id}`;
      const toId = `agent:${event.to_agent_id}`;
      const findingId = `finding:${event.id}`;

      nodeMap.set(fromId, { id: fromId, label: event.from_agent_id, type: "agent" });
      nodeMap.set(toId, { id: toId, label: event.to_agent_id, type: "agent" });
      nodeMap.set(findingId, { id: findingId, label: event.content, type: "finding" });

      edges.push({ from: fromId, to: findingId, relation: "hands_off" });
      edges.push({ from: findingId, to: toId, relation: "received_by" });
    }

    return {
      nodes: Array.from(nodeMap.values()),
      edges
    };
  }
}

const knowledgeStore = new KnowledgeStore();

export { knowledgeStore };
export type { HandoffEvent };
