import type { Metadata } from "next";
import Link from "next/link";

import { GlobalMemorySearch } from "../components/global-memory-search";
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
              <Link href="/agents">Agentes</Link>
              <Link href="/agents/new">Crear Agente</Link>
            </nav>
            <div className="header-tools">
              <GlobalMemorySearch />
            </div>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
