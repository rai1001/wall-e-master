import type { MemoryIngestInput } from "./memory-store";
import { MemoryStore } from "./memory-store";

interface QueueResult {
  status: "queued";
  memory_id: string;
}

class MemoryEventBus {
  constructor(private readonly store: MemoryStore) {}

  ingest(input: MemoryIngestInput): QueueResult {
    const memoryId = this.store.add(input);
    return {
      status: "queued",
      memory_id: memoryId
    };
  }
}

export { MemoryEventBus };
export type { QueueResult };
