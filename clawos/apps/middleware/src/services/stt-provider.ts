interface SttProvider {
  transcribe(_audio: unknown): Promise<string>;
}

class MockSttProvider implements SttProvider {
  async transcribe(_audio: unknown): Promise<string> {
    return "resume project status for today";
  }
}

export { MockSttProvider };
export type { SttProvider };
