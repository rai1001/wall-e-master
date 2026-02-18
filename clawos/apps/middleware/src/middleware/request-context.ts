import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

function requestContextMiddleware(_req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  res.locals.request_id = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const requestId = String(res.locals.request_id ?? "unknown");
    const logEntry = {
      level: "info",
      request_id: requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: durationMs
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
}

export { requestContextMiddleware, requestLoggerMiddleware };
