import { randomUUID } from "node:crypto";

import { ClientStream } from "../ws/client-stream";
import { buildSharedSystemPrompt } from "../prompts/shared-system-prompt";
import { parseUsageTelemetryEnvelope, type UsageTelemetryEvent } from "./usage-telemetry";

interface OpenClawBridgeOptions {
  url: string;
  reconnectAttempts?: number;
  connectTimeoutMs?: number;
  onUsageTelemetry?: (event: UsageTelemetryEvent) => void;
  onAgentEvent?: (event: AgentRuntimeEvent) => void;
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

interface AgentDispatchInput extends AgentRequestInput {
  agentId: string;
  timeoutMs?: number;
}

interface AgentDispatchResult {
  requestId: string;
  response: string;
  delivered: boolean;
}

interface AgentRuntimeEvent {
  project_id: string;
  agent_id?: string;
  agent_name?: string;
  kind: "thought" | "action";
  content: string;
  timestamp: string;
}

interface PendingAgentResponse {
  resolve: (response: string) => void;
  timer: ReturnType<typeof setTimeout>;
}

class OpenClawBridge {
  private readonly options: OpenClawBridgeOptions;
  private readonly stream: ClientStream;
  private readonly pendingResponses = new Map<string, PendingAgentResponse>();

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

  async requestAgentResponse(input: AgentDispatchInput): Promise<AgentDispatchResult> {
    const requestId = randomUUID();
    const connected = await this.ensureConnected();
    if (!connected) {
      return {
        requestId,
        delivered: false,
        response: `No se pudo conectar con OpenClaw para ${input.agentName}.`
      };
    }

    const request = this.buildAgentRequest(input);
    const timeoutMs = input.timeoutMs ?? 2_500;
    const responsePromise = new Promise<string>((resolve) => {
      const timer = setTimeout(() => {
        this.pendingResponses.delete(requestId);
        resolve(`Comando enviado a ${input.agentName}. Esperando respuesta en OpenClaw.`);
      }, timeoutMs);

      this.pendingResponses.set(requestId, {
        resolve,
        timer
      });
    });

    try {
      await this.stream.send({
        type: "agent_request",
        request_id: requestId,
        project_id: input.projectId,
        agent_id: input.agentId,
        agent_name: input.agentName,
        message: request.message,
        system_prompt: request.systemPrompt,
        allowed_tools: input.allowedTools,
        memory_scope: input.memoryScope
      });
    } catch {
      const pending = this.pendingResponses.get(requestId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingResponses.delete(requestId);
      }

      return {
        requestId,
        delivered: false,
        response: `No se pudo enviar el comando al agente ${input.agentName}.`
      };
    }

    const response = await responsePromise;
    const delivered = !response.startsWith("No se pudo");
    return {
      requestId,
      delivered,
      response
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
    let envelope: unknown;
    try {
      envelope = JSON.parse(rawMessage) as unknown;
    } catch {
      return;
    }

    if (this.options.onUsageTelemetry) {
      const usageEvent = parseUsageTelemetryEnvelope(envelope);
      if (usageEvent) {
        this.options.onUsageTelemetry(usageEvent);
      }
    }

    const response = this.parseAgentResponseEnvelope(envelope);
    if (response) {
      this.resolvePendingResponse(response.requestId, response.text);
    }

    if (this.options.onAgentEvent) {
      const runtimeEvent = this.parseAgentRuntimeEventEnvelope(envelope);
      if (runtimeEvent) {
        this.options.onAgentEvent(runtimeEvent);
      }
    }
  }

  private resolvePendingResponse(requestId: string, text: string): void {
    const pending = this.pendingResponses.get(requestId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timer);
    this.pendingResponses.delete(requestId);
    pending.resolve(text);
  }

  private parseAgentResponseEnvelope(input: unknown): { requestId: string; text: string } | null {
    if (!input || typeof input !== "object") {
      return null;
    }

    const envelope = input as Record<string, unknown>;
    const requestId = this.readString(envelope.request_id ?? envelope.response_to ?? envelope.correlation_id);
    if (!requestId) {
      return null;
    }

    const text = this.readString(envelope.message ?? envelope.text ?? envelope.content ?? envelope.response);
    if (!text) {
      return null;
    }

    return { requestId, text };
  }

  private parseAgentRuntimeEventEnvelope(input: unknown): AgentRuntimeEvent | null {
    if (!input || typeof input !== "object") {
      return null;
    }

    const envelope = input as Record<string, unknown>;
    const eventType = this.readString(envelope.type ?? envelope.event ?? envelope.event_type);
    const normalized = eventType.toLowerCase();
    const kind = normalized.includes("thought") ? "thought" : normalized.includes("action") ? "action" : null;
    if (!kind) {
      return null;
    }

    const content = this.readString(envelope.content ?? envelope.message ?? envelope.text);
    if (!content) {
      return null;
    }

    const projectId = this.readString(envelope.project_id ?? envelope.projectId) || "proj_001";
    const agentId = this.readString(envelope.agent_id ?? envelope.agentId) || undefined;
    const agentName = this.readString(envelope.agent_name ?? envelope.agentName) || undefined;
    const timestamp = this.readString(envelope.timestamp) || new Date().toISOString();

    return {
      project_id: projectId,
      agent_id: agentId,
      agent_name: agentName,
      kind,
      content,
      timestamp
    };
  }

  private readString(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
  }
}

export { OpenClawBridge };
export type {
  OpenClawBridgeOptions,
  RecoveryState,
  AgentRequestInput,
  AgentRequest,
  AgentDispatchInput,
  AgentDispatchResult,
  AgentRuntimeEvent,
  UsageTelemetryEvent
};
