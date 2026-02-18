import { ChatShell } from "../components/chat-shell";
import { QuickActions } from "../components/quick-actions";
import { RecoveryBanner } from "../components/recovery-banner";
import { ThoughtTerminal } from "../components/thought-terminal";

export default function HomePage() {
  return (
    <section className="grid">
      <RecoveryBanner />
      <ChatShell />
      <ThoughtTerminal />
      <QuickActions />
    </section>
  );
}
