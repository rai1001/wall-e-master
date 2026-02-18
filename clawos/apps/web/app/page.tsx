import { ChatShell } from "../components/chat-shell";
import { QuickActions } from "../components/quick-actions";
import { RecoveryBanner } from "../components/recovery-banner";
import { ThoughtTerminal } from "../components/thought-terminal";
import { VoiceMode } from "../components/voice-mode";

export default function HomePage() {
  return (
    <section className="grid">
      <RecoveryBanner />
      <ChatShell />
      <VoiceMode />
      <ThoughtTerminal />
      <QuickActions />
    </section>
  );
}
