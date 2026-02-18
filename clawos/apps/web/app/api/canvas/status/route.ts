import { NextResponse } from "next/server";

function isCanvasEnabled(): boolean {
  return String(process.env.CLAWOS_CANVAS_ENABLED ?? "").trim().toLowerCase() === "true";
}

export async function GET() {
  if (!isCanvasEnabled()) {
    return NextResponse.json({
      available: false,
      message: "Canvas no disponible en este entorno. Sigue usando la vista web normal."
    });
  }

  return NextResponse.json({
    available: true,
    message: "Canvas disponible.",
    url: process.env.CLAWOS_CANVAS_URL ?? null
  });
}
