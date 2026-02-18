import { describe, expect, it, vi } from "vitest";

import { emitSecurityEvent, sanitizeForLogs } from "../services/observability";

describe("observability redaction", () => {
  it("redacts sensitive values from nested payloads", () => {
    const payload = {
      authorization: "Bearer secret-token-value",
      token: "abc123",
      profile: {
        audio_base64: "UklGRg...",
        api_key: "openai-key",
        safe_note: "ok"
      }
    };

    const sanitized = sanitizeForLogs(payload) as {
      authorization: string;
      token: string;
      profile: { audio_base64: string; api_key: string; safe_note: string };
    };

    expect(sanitized.authorization).toBe("[REDACTED]");
    expect(sanitized.token).toBe("[REDACTED]");
    expect(sanitized.profile.audio_base64).toBe("[REDACTED]");
    expect(sanitized.profile.api_key).toBe("[REDACTED]");
    expect(sanitized.profile.safe_note).toBe("ok");
  });

  it("emits security events with redacted metadata", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    emitSecurityEvent({
      requestId: "req-123",
      event: "auth_denied",
      outcome: "denied",
      details: {
        authorization: "Bearer should-not-leak",
        reason: "invalid_token"
      }
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const raw = spy.mock.calls[0]?.[0];
    expect(typeof raw).toBe("string");

    const entry = JSON.parse(String(raw)) as {
      security_event: string;
      details: { authorization: string; reason: string };
    };
    expect(entry.security_event).toBe("auth_denied");
    expect(entry.details.authorization).toBe("[REDACTED]");
    expect(entry.details.reason).toBe("invalid_token");

    spy.mockRestore();
  });
});
