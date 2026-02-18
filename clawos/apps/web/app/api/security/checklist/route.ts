import { NextResponse } from "next/server";

import { fetchMiddleware, serviceUnavailableResponse } from "../../../../lib/middleware-client";

export async function GET() {
  try {
    const upstream = await fetchMiddleware("/api/security/checklist");
    const payload = await upstream.json();

    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}
