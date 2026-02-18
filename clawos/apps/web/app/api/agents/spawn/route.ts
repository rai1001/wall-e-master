import { NextResponse } from "next/server";

const defaultBaseUrl = process.env.CLAWOS_MIDDLEWARE_URL ?? "http://127.0.0.1:4000";
const defaultToken = process.env.CLAWOS_API_TOKEN ?? process.env.API_BEARER_TOKEN ?? "dev-token";

function buildMiddlewareUrl(path: string): string {
  const base = defaultBaseUrl.endsWith("/") ? defaultBaseUrl.slice(0, -1) : defaultBaseUrl;
  return `${base}${path}`;
}

export async function POST(req: Request) {
  const payload = (await req.json()) as Record<string, unknown>;

  try {
    const upstream = await fetch(buildMiddlewareUrl("/api/agents/spawn"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${defaultToken}`
      },
      body: JSON.stringify(payload)
    });

    const body = await upstream.json();
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "middleware_unavailable",
          message: "No se pudo conectar con el middleware local",
          details: {
            recovery_action: "Inicia el middleware local y vuelve a intentar la creacion del agente."
          }
        }
      },
      { status: 503 }
    );
  }
}
