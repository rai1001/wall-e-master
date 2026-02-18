interface UsageTelemetryEvent {
  project_id: string;
  agent_id: string;
  agent_name?: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  timestamp?: string;
}

function parseUsageTelemetryPayload(input: unknown): UsageTelemetryEvent | null {
  const payload = asRecord(input);
  if (!payload) {
    return null;
  }

  return parseTelemetryRecord(payload, false);
}

function parseUsageTelemetryEnvelope(input: unknown): UsageTelemetryEvent | null {
  const envelope = asRecord(input);
  if (!envelope) {
    return null;
  }

  const eventType = readString(envelope.type ?? envelope.event ?? envelope.event_type ?? envelope.kind);
  if (!eventType || !isUsageEventType(eventType)) {
    return null;
  }

  const nested =
    asRecord(envelope.payload) ?? asRecord(envelope.data) ?? asRecord(envelope.telemetry) ?? ({} as Record<string, unknown>);
  const merged = {
    ...envelope,
    ...nested
  };

  return parseTelemetryRecord(merged, true);
}

function parseTelemetryRecord(record: Record<string, unknown>, allowAliases: boolean): UsageTelemetryEvent | null {
  const projectId = readString(allowAliases ? record.project_id ?? record.projectId : record.project_id);
  const agentId = readString(allowAliases ? record.agent_id ?? record.agentId : record.agent_id);
  const agentName = readString(allowAliases ? record.agent_name ?? record.agentName : record.agent_name);
  const tokensIn = readNumber(allowAliases ? record.tokens_in ?? record.tokensIn : record.tokens_in);
  const tokensOut = readNumber(allowAliases ? record.tokens_out ?? record.tokensOut : record.tokens_out);
  const costUsd = readNumber(allowAliases ? record.cost_usd ?? record.costUsd : record.cost_usd);
  const timestamp = readString(record.timestamp);

  if (!projectId || !agentId || tokensIn === null || tokensOut === null || costUsd === null) {
    return null;
  }

  if (tokensIn < 0 || tokensOut < 0 || costUsd < 0) {
    return null;
  }

  return {
    project_id: projectId,
    agent_id: agentId,
    agent_name: agentName || undefined,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_usd: costUsd,
    timestamp: timestamp || undefined
  };
}

function isUsageEventType(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "usage_telemetry" || normalized === "usage" || normalized === "cost_usage";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export { parseUsageTelemetryPayload, parseUsageTelemetryEnvelope };
export type { UsageTelemetryEvent };
