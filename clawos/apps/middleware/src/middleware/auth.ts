import type { NextFunction, Request, Response } from "express";

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const expectedToken = process.env.API_BEARER_TOKEN ?? "dev-token";

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      error: {
        code: "unauthorized",
        message: "Bearer token required",
        details: {}
      }
    });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (token !== expectedToken) {
    res.status(401).json({
      error: {
        code: "unauthorized",
        message: "Invalid bearer token",
        details: {}
      }
    });
    return;
  }

  next();
}

export { authMiddleware };
