type ErrorTaxonomy = "auth" | "validation" | "policy" | "resource" | "throttle" | "dependency" | "availability" | "unknown";

interface SecurityEventInput {
  requestId: string;
  event: string;
  outcome: "allowed" | "denied" | "warning";
  details?: Record<string, unknown>;
}

interface CounterRow {
  kind: "security_event" | "error_taxonomy";
  key: string;
  timestamp: number;
}

interface CounterSummary {
  key: string;
  count: number;
}

const ERROR_TAXONOMY_MAP: Record<string, ErrorTaxonomy> = {
  unauthorized: "auth",
  validation_error: "validation",
  payload_too_large: "validation",
  policy_denied: "policy",
  not_found: "resource",
  rate_limited: "throttle",
  provider_configuration_error: "dependency",
  provider_runtime_error: "dependency",
  service_unavailable: "availability"
};

const SENSITIVE_KEY_PATTERNS = [/authorization/i, /token/i, /api[_-]?key/i, /secret/i, /password/i, /audio_base64/i];
const MAX_RETENTION_MS = 24 * 60 * 60 * 1000;
const counterRows: CounterRow[] = [];

function pruneCounters(now: number): void {
  const minTimestamp = now - MAX_RETENTION_MS;
  let writeIndex = 0;

  for (let readIndex = 0; readIndex < counterRows.length; readIndex += 1) {
    const row = counterRows[readIndex];
    if (row.timestamp >= minTimestamp) {
      counterRows[writeIndex] = row;
      writeIndex += 1;
    }
  }

  counterRows.length = writeIndex;
}

function recordCounter(kind: CounterRow["kind"], key: string): void {
  const now = Date.now();
  pruneCounters(now);
  counterRows.push({
    kind,
    key,
    timestamp: now
  });
}

function countByKey(rows: CounterRow[]): CounterSummary[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.key, (counts.get(row.key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function classifyErrorCode(code: string): ErrorTaxonomy {
  return ERROR_TAXONOMY_MAP[code] ?? "unknown";
}

function buildErrorResponse(
  code: string,
  message: string,
  details: Record<string, unknown> = {}
): {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
} {
  const taxonomy = classifyErrorCode(code);
  recordCounter("error_taxonomy", taxonomy);
  return {
    error: {
      code,
      message,
      details: {
        ...details,
        taxonomy
      }
    }
  };
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizeForLogs(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLogs(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const source = value as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, fieldValue] of Object.entries(source)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeForLogs(fieldValue);
    }
  }

  return sanitized;
}

function emitSecurityEvent(input: SecurityEventInput): void {
  recordCounter("security_event", input.event);
  const entry = {
    level: "warn",
    event_type: "security",
    security_event: input.event,
    outcome: input.outcome,
    request_id: input.requestId,
    details: sanitizeForLogs(input.details ?? {})
  };

  console.log(JSON.stringify(entry));
}

function getObservabilitySummary(windowMinutes: number): {
  generated_at: string;
  window_minutes: number;
  total_security_events: number;
  total_errors: number;
  security_event_counters: CounterSummary[];
  error_taxonomy_counters: CounterSummary[];
  alert_status: "nominal" | "watch" | "critical";
  alerts: string[];
} {
  const normalizedWindow = Math.max(1, Math.min(windowMinutes, 24 * 60));
  const now = Date.now();
  pruneCounters(now);

  const minTimestamp = now - normalizedWindow * 60_000;
  const windowRows = counterRows.filter((row) => row.timestamp >= minTimestamp);
  const securityRows = windowRows.filter((row) => row.kind === "security_event");
  const errorRows = windowRows.filter((row) => row.kind === "error_taxonomy");

  const securityCounters = countByKey(securityRows);
  const taxonomyCounters = countByKey(errorRows);

  const authDeniedCount = securityCounters.find((row) => row.key === "auth_denied")?.count ?? 0;
  const policyDeniedCount = securityCounters.find((row) => row.key === "global_memory_access_denied")?.count ?? 0;
  const throttleCount = taxonomyCounters.find((row) => row.key === "throttle")?.count ?? 0;
  const dependencyCount = taxonomyCounters.find((row) => row.key === "dependency")?.count ?? 0;

  const alerts: string[] = [];
  if (authDeniedCount >= 5) {
    alerts.push("Múltiples bloqueos de autenticación detectados.");
  }
  if (policyDeniedCount >= 3) {
    alerts.push("Se detectaron varias denegaciones de política de permisos.");
  }
  if (throttleCount >= 3) {
    alerts.push("El rate limit está activándose con frecuencia.");
  }
  if (dependencyCount >= 3) {
    alerts.push("Errores de dependencias externas por encima del umbral.");
  }

  let alertStatus: "nominal" | "watch" | "critical" = "nominal";
  if (alerts.length >= 2) {
    alertStatus = "critical";
  } else if (alerts.length === 1 || securityRows.length >= 5 || errorRows.length >= 5) {
    alertStatus = "watch";
  }

  return {
    generated_at: new Date(now).toISOString(),
    window_minutes: normalizedWindow,
    total_security_events: securityRows.length,
    total_errors: errorRows.length,
    security_event_counters: securityCounters,
    error_taxonomy_counters: taxonomyCounters,
    alert_status: alertStatus,
    alerts
  };
}

function resetObservabilityStore(): void {
  counterRows.length = 0;
}

export {
  buildErrorResponse,
  classifyErrorCode,
  sanitizeForLogs,
  emitSecurityEvent,
  getObservabilitySummary,
  resetObservabilityStore
};
export type { ErrorTaxonomy, SecurityEventInput };
