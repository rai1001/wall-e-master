interface TtsProvider {
  synthesize(_text: string): Promise<string>;
}

class MockTtsProvider implements TtsProvider {
  async synthesize(_text: string): Promise<string> {
    return "/api/voice/output/response_123.mp3";
  }
}

export { MockTtsProvider };
export type { TtsProvider };
