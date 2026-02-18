import type { NextFunction, Request, Response } from "express";

import { buildErrorResponse, emitSecurityEvent } from "../services/observability";

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const expectedToken = process.env.API_BEARER_TOKEN ?? "dev-token";
  const requestId = String(res.locals.request_id ?? "unknown");

  if (!header || !header.startsWith("Bearer ")) {
    emitSecurityEvent({
      requestId,
      event: "auth_denied",
      outcome: "denied",
      details: {
        reason: "missing_bearer_token",
        authorization: header ?? ""
      }
    });
    res.status(401).json(
      buildErrorResponse("unauthorized", "Bearer token required", {
        recovery_action: "Send Authorization: Bearer <API_BEARER_TOKEN>."
      })
    );
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (token !== expectedToken) {
    emitSecurityEvent({
      requestId,
      event: "auth_denied",
      outcome: "denied",
      details: {
        reason: "invalid_bearer_token",
        authorization: header
      }
    });
    res.status(401).json(
      buildErrorResponse("unauthorized", "Invalid bearer token", {
        recovery_action: "Verify API_BEARER_TOKEN value and retry."
      })
    );
    return;
  }

  next();
}

export { authMiddleware };
