import { NextResponse } from "next/server";

import { requestMiddleware, serviceUnavailableResponse } from "../../../../lib/middleware-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id") ?? "proj_001";

  try {
    const upstream = await requestMiddleware(`/api/costs/summary?project_id=${encodeURIComponent(projectId)}`, {
      method: "GET"
    });
    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}

export async function PATCH(req: Request) {
  let payload: { project_id?: string; budget_usd?: number } = {};
  try {
    payload = (await req.json()) as { project_id?: string; budget_usd?: number };
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Body JSON invalido",
          details: {
            recovery_action: "Envia project_id y budget_usd en formato JSON."
          }
        }
      },
      { status: 400 }
    );
  }

  try {
    const upstream = await requestMiddleware("/api/costs/summary", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const upstreamPayload = await upstream.json();
    return NextResponse.json(upstreamPayload, { status: upstream.status });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}
