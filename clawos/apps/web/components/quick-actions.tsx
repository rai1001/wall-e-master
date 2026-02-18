export function QuickActions() {
  return (
    <article className="card">
      <h2>Acciones Rapidas</h2>
      <p className="muted">Usa botones simples para iniciar sin pasos tecnicos.</p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
        <button type="button">Hablar con agente</button>
        <button type="button">Crear agente</button>
        <button type="button">Buscar memoria</button>
      </div>
    </article>
  );
}
