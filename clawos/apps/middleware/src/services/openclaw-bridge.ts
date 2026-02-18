import { ClientStream } from "../ws/client-stream";

interface OpenClawBridgeOptions {
  url: string;
  reconnectAttempts?: number;
}

interface RecoveryState {
  recovered: boolean;
  attempts: number;
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
export type { OpenClawBridgeOptions, RecoveryState };
