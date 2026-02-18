import { NextResponse } from "next/server";

import { fetchMiddleware, serviceUnavailableResponse } from "../../../../../lib/middleware-client";

export async function GET(_req: Request, context: { params: Promise<{ fileName: string }> }) {
  const params = await context.params;
  const fileName = encodeURIComponent(params.fileName);

  try {
    const upstream = await fetchMiddleware(`/api/voice/output/${fileName}`);

    if (!upstream.ok) {
      const payload = await upstream.json();
      return NextResponse.json(payload, { status: upstream.status });
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "audio/mpeg"
      }
    });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}
