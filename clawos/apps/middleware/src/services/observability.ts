type ErrorTaxonomy = "auth" | "validation" | "policy" | "resource" | "throttle" | "dependency" | "availability" | "unknown";

interface SecurityEventInput {
  requestId: string;
  event: string;
  outcome: "allowed" | "denied" | "warning";
  details?: Record<string, unknown>;
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
  return {
    error: {
      code,
      message,
      details: {
        ...details,
        taxonomy: classifyErrorCode(code)
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

export { buildErrorResponse, classifyErrorCode, sanitizeForLogs, emitSecurityEvent };
export type { ErrorTaxonomy, SecurityEventInput };
