interface SttProvider {
  transcribe(audio: Buffer): Promise<string>;
}

class MockSttProvider implements SttProvider {
  async transcribe(_audio: Buffer): Promise<string> {
    return "resume project status for today";
  }
}

class OpenAiSttProvider implements SttProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = process.env.OPENAI_STT_MODEL ?? "whisper-1") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async transcribe(audio: Buffer): Promise<string> {
    const form = new FormData();
    const blob = new Blob([audio], { type: "audio/webm" });

    form.append("file", blob, "voice-input.webm");
    form.append("model", this.model);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`
      },
      body: form
    });

    if (!response.ok) {
      throw new Error(`OpenAI STT request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as { text?: string };
    if (typeof payload.text !== "string" || !payload.text.trim()) {
      throw new Error("OpenAI STT returned empty transcript");
    }

    return payload.text.trim();
  }
}

function createSttProviderFromEnv(): SttProvider {
  const provider = String(process.env.STT_PROVIDER ?? "mock").trim().toLowerCase();

  if (provider === "mock") {
    return new MockSttProvider();
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("Set OPENAI_API_KEY when STT_PROVIDER=openai.");
    }

    return new OpenAiSttProvider(apiKey);
  }

  throw new Error(`Unsupported STT_PROVIDER: ${provider}`);
}

export { MockSttProvider, OpenAiSttProvider, createSttProviderFromEnv };
export type { SttProvider };
