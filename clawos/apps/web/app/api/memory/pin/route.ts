import { NextResponse } from "next/server";

import { requestMiddleware, serviceUnavailableResponse } from "../../../../lib/middleware-client";

export async function POST(req: Request) {
  let payload: { memory_id?: string; reason?: string } = {};
  try {
    payload = (await req.json()) as { memory_id?: string; reason?: string };
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Body JSON invalido",
          details: {
            recovery_action: "Envia memory_id en formato JSON."
          }
        }
      },
      { status: 400 }
    );
  }

  try {
    const upstream = await requestMiddleware("/api/memory/pin", {
      method: "POST",
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
