"use client";

import { useEffect, useState } from "react";

interface ProjectStatusResponse {
  project_id: string;
  overall_status: string;
  agents: Array<{ id: string; name: string; status: string }>;
  tasks: {
    todo: number;
    doing: number;
    done: number;
  };
  updated_at: string;
}

export default function ProjectsPage() {
  const [status, setStatus] = useState<ProjectStatusResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/projects/status?project_id=proj_001", {
          method: "GET",
          cache: "no-store"
        });

        const payload = await response.json();
        if (!response.ok) {
          setError(payload?.error?.message ?? "No pudimos cargar el estado del proyecto.");
          return;
        }

        setStatus(payload as ProjectStatusResponse);
      } catch {
        setError("No pudimos cargar el estado del proyecto.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <section className="grid">
      <article className="card">
        <h2>Kanban de Proyecto</h2>
        <p className="muted">Vista en tiempo real del proyecto activo.</p>
        {loading ? <p>Cargando estado...</p> : null}
        {error ? <p className="muted">{error}</p> : null}
        {status ? (
          <>
            <p>Por hacer: {status.tasks.todo}</p>
            <p>En progreso: {status.tasks.doing}</p>
            <p>Completado: {status.tasks.done}</p>
          </>
        ) : null}
      </article>
      <article className="card">
        <h2>Timeline</h2>
        <p className="muted">Actividad actual de agentes conectados.</p>
        {status ? (
          <ul>
            {status.agents.map((agent) => (
              <li key={agent.id}>
                {agent.name}: {agent.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Sin datos de agentes por ahora.</p>
        )}
      </article>
    </section>
  );
}
