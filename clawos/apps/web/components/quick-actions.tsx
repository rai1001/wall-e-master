import Link from "next/link";

export function QuickActions() {
  return (
    <article className="card">
      <h2>Acciones Rapidas</h2>
      <p className="muted">Usa botones simples para iniciar sin pasos tecnicos.</p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
        <button type="button">Hablar con agente</button>
        <Link className="action-link" href="/agents/new">
          Crear agente
        </Link>
        <button type="button">Buscar memoria</button>
      </div>
    </article>
  );
}
