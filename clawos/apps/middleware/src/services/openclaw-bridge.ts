import { ClientStream } from "../ws/client-stream";
import { buildSharedSystemPrompt } from "../prompts/shared-system-prompt";

interface OpenClawBridgeOptions {
  url: string;
  reconnectAttempts?: number;
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
  }

  getUrl(): string {
    return this.options.url;
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

    this.stream.connect();
    this.stream.disconnect();

    let attempts = 0;
    while (!this.stream.isConnected() && attempts < maxAttempts) {
      attempts += 1;
      await this.delay(5 * attempts);
      this.stream.connect();
    }

    return {
      recovered: this.stream.isConnected(),
      attempts
    };
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export { OpenClawBridge };
export type { OpenClawBridgeOptions, RecoveryState, AgentRequestInput, AgentRequest };
