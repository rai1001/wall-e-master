import WebSocket from "ws";

class ClientStream {
  private socket: WebSocket | null = null;
  private connectPromise: Promise<boolean> | null = null;
  private readonly messageHandlers = new Set<(message: string) => void>();

  async connect(url: string, timeoutMs = 1_500): Promise<boolean> {
    if (this.isConnected()) {
      return true;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = new Promise<boolean>((resolve) => {
      const socket = new WebSocket(url);
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        socket.terminate();
        this.socket = null;
        resolve(false);
      }, timeoutMs);

      const finalize = (connected: boolean) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeout);
        resolve(connected);
      };

      socket.once("open", () => {
        this.socket = socket;
        finalize(true);
      });

      socket.once("error", () => {
        this.socket = null;
        finalize(false);
      });

      socket.once("close", () => {
        if (this.socket === socket) {
          this.socket = null;
        }
      });

      socket.on("message", (data) => {
        const message = typeof data === "string" ? data : Buffer.from(data).toString("utf8");
        for (const handler of this.messageHandlers) {
          handler(message);
        }
      });
    }).finally(() => {
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  onMessage(handler: (message: string) => void): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  async send(payload: string | Record<string, unknown>): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("OpenClaw stream is not connected");
    }

    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    await new Promise<void>((resolve, reject) => {
      this.socket?.send(body, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

export { ClientStream };
