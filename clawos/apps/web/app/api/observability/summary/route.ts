import { NextResponse } from "next/server";

import { fetchMiddleware, serviceUnavailableResponse } from "../../../../lib/middleware-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const windowMinutes = searchParams.get("window_minutes") ?? "60";

  try {
    const upstream = await fetchMiddleware(`/api/observability/summary?window_minutes=${encodeURIComponent(windowMinutes)}`);
    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}
