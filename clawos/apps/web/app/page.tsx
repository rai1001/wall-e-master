import Link from "next/link";

import { ChatShell } from "../components/chat-shell";
import { QuickActions } from "../components/quick-actions";
import { RecoveryBanner } from "../components/recovery-banner";
import { ThoughtTerminal } from "../components/thought-terminal";
import { VoiceMode } from "../components/voice-mode";

export default function HomePage() {
  return (
    <section className="grid">
      <RecoveryBanner />
      <article className="card">
        <h2>Ayuda para operacion diaria</h2>
        <p className="muted">Si tienes dudas, abre la guia paso a paso para personal no tecnico.</p>
        <Link className="action-link" href="/help" style={{ marginTop: "8px" }}>
          Ayuda rapida
        </Link>
      </article>
      <ChatShell />
      <VoiceMode />
      <ThoughtTerminal />
      <QuickActions />
    </section>
  );
}
