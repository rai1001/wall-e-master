import Link from "next/link";

import { fallbackMessage, getDocBySlug } from "../../../lib/non-technical-docs";

interface HelpDocPageProps {
  params: Promise<{
    docId: string;
  }>;
}

export default async function HelpDocPage({ params }: HelpDocPageProps) {
  const { docId } = await params;
  const doc = await getDocBySlug(docId);

  if (!doc) {
    return (
      <section className="grid">
        <article className="card">
          <h2>Guia no encontrada</h2>
          <p className="muted">{fallbackMessage}</p>
          <Link className="action-link" href="/help">
            Volver al centro de ayuda
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="grid">
      <article className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>{doc.title}</h2>
        <p className="muted">{doc.available ? "Documento operativo cargado." : fallbackMessage}</p>
        <div style={{ marginTop: "10px" }}>
          <Link className="action-link" href="/help">
            Volver al indice
          </Link>
        </div>
      </article>
      <article className="card" style={{ gridColumn: "1 / -1" }}>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
            lineHeight: 1.5
          }}
        >
          {doc.content}
        </pre>
      </article>
    </section>
  );
}
