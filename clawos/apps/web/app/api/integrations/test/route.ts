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
          message: "Payload de prueba invalido",
          details: {
            recovery_action: "Selecciona el servicio y vuelve a intentarlo."
          }
        }
      },
      { status: 400 }
    );
  }

  try {
    const upstream = await requestMiddleware("/api/integrations/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const body = await upstream.json();
    return NextResponse.json(body, { status: upstream.status });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}
