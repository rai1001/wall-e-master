import { ChatShell } from "../components/chat-shell";
import { ThoughtTerminal } from "../components/thought-terminal";

export default function HomePage() {
  return (
    <section className="grid">
      <ChatShell />
      <ThoughtTerminal />
      <article className="card">
        <h2>Acciones Rapidas</h2>
        <p className="muted">1) Hablar con un agente 2) Ver progreso 3) Buscar en memoria global</p>
      </article>
    </section>
  );
}
