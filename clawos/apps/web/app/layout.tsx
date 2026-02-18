import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

export const metadata: Metadata = {
  title: "ClawOS",
  description: "Control panel for local OpenClaw orchestration"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <main className="app-shell">
          <header>
            <h1>ClawOS</h1>
            <p className="muted">Controla tus agentes de OpenClaw sin friccion.</p>
            <nav className="top-nav">
              <Link href="/">Inicio</Link>
              <Link href="/projects">Proyectos</Link>
              <Link href="/agents/new">Crear Agente</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
