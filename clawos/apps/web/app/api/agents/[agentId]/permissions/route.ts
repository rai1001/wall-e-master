import { NextResponse } from "next/server";

import { requestMiddleware, serviceUnavailableResponse } from "../../../../../lib/middleware-client";

export async function PATCH(req: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params;
  const body = await req.json();

  try {
    const upstream = await requestMiddleware(`/api/agents/${encodeURIComponent(agentId)}/permissions`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}
