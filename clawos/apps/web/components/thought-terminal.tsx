"use client";

import { useEffect, useState } from "react";

interface ProjectEvent {
  id: string;
  kind: "thought" | "action";
  content: string;
  timestamp: string;
  agent_name?: string;
}

interface ProjectEventsResponse {
  project_id: string;
  events: ProjectEvent[];
}

function toLabel(event: ProjectEvent): string {
  return event.kind === "thought" ? "Pensando" : "Haciendo";
}

export function ThoughtTerminal() {
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch("/api/projects/events?project_id=proj_001&limit=8", {
          method: "GET",
          cache: "no-store"
        });
        const payload = (await response.json()) as ProjectEventsResponse;
        if (!active) {
          return;
        }

        if (!response.ok) {
          setError("No pudimos leer eventos en tiempo real.");
          return;
        }

        setError("");
        setEvents(Array.isArray(payload.events) ? payload.events : []);
      } catch {
        if (active) {
          setError("No pudimos conectar con eventos del proyecto.");
        }
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 3_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="card">
      <h2>Terminal de Pensamiento</h2>
      <p className="muted">Separa en vivo lo que el agente piensa de lo que ejecuta.</p>
      {error ? <p className="muted">{error}</p> : null}
      {events.length > 0 ? (
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              {toLabel(event)}: {event.content}
              {event.agent_name ? ` (${event.agent_name})` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <ul>
          <li>Pensando: esperando eventos del agente activo.</li>
          <li>Haciendo: se mostrara al detectar actividad real.</li>
        </ul>
      )}
    </section>
  );
}
