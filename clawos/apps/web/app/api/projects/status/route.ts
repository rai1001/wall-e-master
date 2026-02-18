import { NextResponse } from "next/server";

import { fetchMiddleware, serviceUnavailableResponse } from "../../../../lib/middleware-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id") ?? "proj_001";

  try {
    const upstream = await fetchMiddleware(`/api/projects/status?project_id=${encodeURIComponent(projectId)}`);
    const payload = await upstream.json();

    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}
