import { ClientStream } from "../ws/client-stream";
import { buildSharedSystemPrompt } from "../prompts/shared-system-prompt";

interface UsageTelemetryEvent {
  project_id: string;
  agent_id: string;
  agent_name?: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  timestamp?: string;
}

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

    const usageEvent = this.parseUsageTelemetry(rawMessage);
    if (!usageEvent) {
      return;
    }

    this.options.onUsageTelemetry(usageEvent);
  }

  private parseUsageTelemetry(rawMessage: string): UsageTelemetryEvent | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawMessage) as unknown;
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const envelope = parsed as Record<string, unknown>;
    const eventType = this.readString(envelope.type ?? envelope.event ?? envelope.event_type ?? envelope.kind);
    if (!eventType || !this.isUsageEventType(eventType)) {
      return null;
    }

    const projectId = this.readString(envelope.project_id ?? envelope.projectId);
    const agentId = this.readString(envelope.agent_id ?? envelope.agentId);
    const agentName = this.readString(envelope.agent_name ?? envelope.agentName);
    const tokensIn = this.readNumber(envelope.tokens_in ?? envelope.tokensIn);
    const tokensOut = this.readNumber(envelope.tokens_out ?? envelope.tokensOut);
    const costUsd = this.readNumber(envelope.cost_usd ?? envelope.costUsd);
    const timestamp = this.readString(envelope.timestamp);

    if (!projectId || !agentId || tokensIn === null || tokensOut === null || costUsd === null) {
      return null;
    }

    if (tokensIn < 0 || tokensOut < 0 || costUsd < 0) {
      return null;
    }

    return {
      project_id: projectId,
      agent_id: agentId,
      agent_name: agentName || undefined,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      cost_usd: costUsd,
      timestamp: timestamp || undefined
    };
  }

  private isUsageEventType(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === "usage_telemetry" || normalized === "usage" || normalized === "cost_usage";
  }

  private readString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }

  private readNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }
}

export { OpenClawBridge };
export type { OpenClawBridgeOptions, RecoveryState, AgentRequestInput, AgentRequest, UsageTelemetryEvent };
