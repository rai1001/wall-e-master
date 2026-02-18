interface TtsOptions {
  voiceId?: string;
}

interface TtsSynthesisResult {
  audioBuffer: Buffer;
  mimeType: "audio/mpeg";
}

interface TtsProvider {
  synthesize(text: string, options?: TtsOptions): Promise<TtsSynthesisResult>;
}

class MockTtsProvider implements TtsProvider {
  async synthesize(_text: string): Promise<TtsSynthesisResult> {
    return {
      audioBuffer: Buffer.from("mock_tts_audio_response"),
      mimeType: "audio/mpeg"
    };
  }
}

class ElevenLabsTtsProvider implements TtsProvider {
  private readonly apiKey: string;
  private readonly defaultVoiceId: string;
  private readonly modelId: string;

  constructor(
    apiKey: string,
    defaultVoiceId: string,
    modelId = process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2"
  ) {
    this.apiKey = apiKey;
    this.defaultVoiceId = defaultVoiceId;
    this.modelId = modelId;
  }

  async synthesize(text: string, options?: TtsOptions): Promise<TtsSynthesisResult> {
    const voiceId = options?.voiceId?.trim() || this.defaultVoiceId;
    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": this.apiKey
      },
      body: JSON.stringify({
        text,
        model_id: this.modelId
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS request failed with status ${response.status}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    return {
      audioBuffer,
      mimeType: "audio/mpeg"
    };
  }
}

function createTtsProviderFromEnv(): TtsProvider {
  const provider = String(process.env.TTS_PROVIDER ?? "mock").trim().toLowerCase();

  if (provider === "mock") {
    return new MockTtsProvider();
  }

  if (provider === "elevenlabs") {
    const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("Set ELEVENLABS_API_KEY when TTS_PROVIDER=elevenlabs.");
    }

    const defaultVoiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID?.trim() ?? "default";
    return new ElevenLabsTtsProvider(apiKey, defaultVoiceId);
  }

  throw new Error(`Unsupported TTS_PROVIDER: ${provider}`);
}

export { MockTtsProvider, ElevenLabsTtsProvider, createTtsProviderFromEnv };
export type { TtsProvider, TtsOptions, TtsSynthesisResult };
