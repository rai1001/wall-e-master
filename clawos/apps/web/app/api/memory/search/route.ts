import { NextResponse } from "next/server";

import { fetchMiddleware, serviceUnavailableResponse } from "../../../../lib/middleware-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const projectId = searchParams.get("project_id") ?? "proj_001";

  if (!query.trim()) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "q es obligatorio",
          details: {
            recovery_action: "Escribe una consulta y vuelve a buscar."
          }
        }
      },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetchMiddleware(
      `/api/memory/search?q=${encodeURIComponent(query)}&project_id=${encodeURIComponent(projectId)}`
    );
    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status });
  } catch {
    return NextResponse.json(serviceUnavailableResponse(), { status: 503 });
  }
}
