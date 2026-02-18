export default function ProjectsPage() {
  return (
    <section className="grid">
      <article className="card">
        <h2>Kanban de Proyecto</h2>
        <p className="muted">Vista simplificada para usuario no tecnico.</p>
        <p>Por hacer: 12</p>
        <p>En progreso: 4</p>
        <p>Completado: 18</p>
      </article>
      <article className="card">
        <h2>Timeline</h2>
        <p className="muted">Ultimos avances de agentes.</p>
        <ul>
          <li>Lince: actualizo memoria global</li>
          <li>Sastre: preparo siguiente accion tecnica</li>
        </ul>
      </article>
    </section>
  );
}
