import Link from "next/link";

import { getNonTechnicalDocsIndex } from "../../lib/non-technical-docs";

export default async function HelpPage() {
  const docs = await getNonTechnicalDocsIndex();

  return (
    <section className="grid">
      <article className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>Centro de Ayuda</h2>
        <p className="muted">Guias en lenguaje simple para operacion diaria (chef/hotel).</p>
      </article>

      {docs.map((doc) => (
        <article className="card" key={doc.slug}>
          <h3>
            <Link href={`/help/${doc.slug}`}>{doc.title}</Link>
          </h3>
          <p className="muted">{doc.summary}</p>
          <p className="muted" style={{ marginTop: "8px" }}>
            Estado: {doc.available ? "disponible" : "revisar documento"}
          </p>
          <Link className="action-link" href={`/help/${doc.slug}`} style={{ marginTop: "10px" }}>
            Abrir guia
          </Link>
        </article>
      ))}
    </section>
  );
}
