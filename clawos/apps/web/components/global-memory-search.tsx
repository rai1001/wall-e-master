"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

interface MemorySearchResult {
  id: string;
  content: string;
  metadata: {
    agent_id: string;
    project_id?: string;
    source: string;
    timestamp?: string;
  };
}

const DEFAULT_STATUS = "Escribe un tema para buscar en toda la memoria compartida.";

export function GlobalMemorySearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [error, setError] = useState("");
  const [results, setResults] = useState<MemorySearchResult[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const shortcutLabel = useMemo(() => {
    if (typeof navigator !== "undefined" && /mac/i.test(navigator.platform)) {
      return "Cmd+K";
    }

    return "Ctrl+K";
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";
      if (isSearchShortcut) {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);

    return () => window.clearTimeout(timer);
  }, [open]);

  const closeDialog = () => {
    setOpen(false);
    setError("");
    setStatus(DEFAULT_STATUS);
  };

  const onSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) {
      setStatus("Escribe una palabra o frase para buscar.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Buscando recuerdos relevantes...");

    try {
      const response = await fetch(`/api/memory/search?q=${encodeURIComponent(normalized)}`, { method: "GET" });
      const payload = await response.json();

      if (!response.ok) {
        setResults([]);
        setError(payload?.error?.message ?? "No pudimos completar la busqueda.");
        setStatus("No se pudo buscar en memoria.");
        return;
      }

      const rows = Array.isArray(payload.results) ? (payload.results as MemorySearchResult[]) : [];
      setResults(rows);
      setStatus(rows.length > 0 ? "Contexto encontrado en memoria compartida." : "No encontramos resultados para este tema.");
    } catch {
      setResults([]);
      setError("No pudimos conectar con el middleware local.");
      setStatus("Sin conexion al servicio de memoria.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="global-search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Abrir buscador global"
      >
        Buscar memoria global
        <span className="shortcut-key">{shortcutLabel}</span>
      </button>

      {open ? (
        <div
          className="command-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <section className="command-dialog" role="dialog" aria-modal="true" aria-labelledby="global-search-title">
            <div className="command-header">
              <h2 id="global-search-title">Buscador Global</h2>
              <button type="button" className="close-button" onClick={closeDialog}>
                Cerrar
              </button>
            </div>

            <p className="muted">Busca en lo que aprendieron todos tus agentes sin tocar configuraciones tecnicas.</p>

            <form className="command-form" onSubmit={onSearch}>
              <input
                ref={inputRef}
                aria-label="Buscar en memoria global"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ejemplo: cambios API Stripe"
                className="command-input"
              />
              <button type="submit" disabled={loading}>
                {loading ? "Buscando..." : "Buscar en toda la memoria"}
              </button>
            </form>

            <div className="command-status">
              <strong>Estado:</strong> {status}
            </div>

            {error ? (
              <p className="muted" style={{ marginTop: "8px" }}>
                {error}
              </p>
            ) : null}

            {results.length > 0 ? (
              <ul className="command-results">
                {results.map((item) => (
                  <li key={item.id}>
                    <p>{item.content}</p>
                    <p className="muted">
                      {item.metadata.agent_id} · {item.metadata.project_id ?? "sin-proyecto"} · {item.metadata.source}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
