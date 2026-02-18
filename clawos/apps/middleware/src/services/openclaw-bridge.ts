import { ClientStream } from "../ws/client-stream";
import { buildSharedSystemPrompt } from "../prompts/shared-system-prompt";
import { parseUsageTelemetryEnvelope, type UsageTelemetryEvent } from "./usage-telemetry";

interface OpenClawBridgeOptions {
  url: string;
  reconnectAttempts?: number;
  connectTimeoutMs?: number;
  onUsageTelemetry?: (event: UsageTelemetryEvent) => void;
}

interface RecoveryState {
  recovered: boolean;
  attempts: number;
}

interface AgentRequestInput {
  agentName: string;
  projectId: string;
  allowedTools: string[];
  memoryScope: "project" | "global";
  userMessage: string;
}

interface AgentRequest {
  systemPrompt: string;
  message: string;
}

class OpenClawBridge {
  private readonly options: OpenClawBridgeOptions;
  private readonly stream: ClientStream;

  constructor(options: OpenClawBridgeOptions) {
    this.options = options;
    this.stream = new ClientStream();
    this.stream.onMessage((rawMessage) => {
      this.handleStreamMessage(rawMessage);
    });
  }

  getUrl(): string {
    return this.options.url;
  }

  isConnected(): boolean {
    return this.stream.isConnected();
  }

  async ensureConnected(): Promise<boolean> {
    if (this.stream.isConnected()) {
      return true;
    }

    return this.stream.connect(this.options.url, this.options.connectTimeoutMs ?? 1_500);
  }

  disconnect(): void {
    this.stream.disconnect();
  }

  buildAgentRequest(input: AgentRequestInput): AgentRequest {
    return {
      systemPrompt: buildSharedSystemPrompt({
        agentName: input.agentName,
        projectId: input.projectId,
        allowedTools: input.allowedTools,
        memoryScope: input.memoryScope
      }),
      message: input.userMessage
    };
  }

  async simulateDisconnectAndRecover(): Promise<RecoveryState> {
    const maxAttempts = this.options.reconnectAttempts ?? 3;

    await this.ensureConnected();
    this.stream.disconnect();

    let attempts = 0;
    while (!this.stream.isConnected() && attempts < maxAttempts) {
      attempts += 1;
      await this.delay(5 * attempts);
      await this.ensureConnected();
    }

    return {
      recovered: this.stream.isConnected(),
      attempts
    };
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleStreamMessage(rawMessage: string): void {
    if (!this.options.onUsageTelemetry) {
      return;
    }

    let envelope: unknown;
    try {
      envelope = JSON.parse(rawMessage) as unknown;
    } catch {
      return;
    }

    const usageEvent = parseUsageTelemetryEnvelope(envelope);
    if (!usageEvent) {
      return;
    }

    this.options.onUsageTelemetry(usageEvent);
  }
}

export { OpenClawBridge };
export type { OpenClawBridgeOptions, RecoveryState, AgentRequestInput, AgentRequest, UsageTelemetryEvent };
