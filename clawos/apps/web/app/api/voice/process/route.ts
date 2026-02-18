import { NextResponse } from "next/server";

import { requestMiddleware, serviceUnavailableResponse } from "../../../../lib/middleware-client";

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Payload de voz invalido",
          details: {
            recovery_action: "Verifica audio_base64 y agent_id antes de reintentar."
          }
        }
      },
      { status: 400 }
    );
  }

  try {
    const upstream = await requestMiddleware("/api/voice/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const responsePayload = await upstream.json();
    return NextResponse.json(responsePayload, { status: upstream.status });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}
