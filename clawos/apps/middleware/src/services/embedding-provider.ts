const EMBEDDING_VECTOR_DIMENSIONS = 16;

type EmbeddingTask = "query" | "document";

interface EmbeddingProvider {
  embed(text: string, task: EmbeddingTask): Promise<number[]>;
}

class EmbeddingConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingConfigurationError";
  }
}

class EmbeddingRuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddingRuntimeError";
  }
}

function normalizeVector(values: number[], dimensions = EMBEDDING_VECTOR_DIMENSIONS): number[] {
  if (values.length === 0) {
    return Array.from({ length: dimensions }, () => 0);
  }

  const output = Array.from({ length: dimensions }, () => 0);
  for (let index = 0; index < values.length; index += 1) {
    output[index % dimensions] += values[index];
  }

  const norm = Math.sqrt(output.reduce((acc, value) => acc + value * value, 0)) || 1;
  return output.map((value) => value / norm);
}

class LocalEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    const output = Array.from({ length: EMBEDDING_VECTOR_DIMENSIONS }, () => 0);
    for (let index = 0; index < text.length; index += 1) {
      output[index % EMBEDDING_VECTOR_DIMENSIONS] += text.charCodeAt(index) % 127;
    }

    return normalizeVector(output);
  }
}

interface GoogleEmbeddingPayload {
  embedding?: {
    values?: unknown[];
  };
  embeddings?: Array<{
    values?: unknown[];
  }>;
}

interface OpenAiEmbeddingPayload {
  data?: Array<{
    embedding?: unknown[];
  }>;
}

class GoogleEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(
    apiKey: string,
    model = process.env.GOOGLE_EMBEDDING_MODEL ?? "gemini-embedding-001",
    baseUrl = process.env.GOOGLE_EMBEDDING_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta"
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async embed(text: string, task: EmbeddingTask): Promise<number[]> {
    const endpoint = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:embedContent`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }]
          },
          taskType: task === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT"
        })
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      throw new EmbeddingRuntimeError(`Google embeddings request failed: ${message}`);
    }

    if (!response.ok) {
      throw new EmbeddingRuntimeError(`Google embeddings request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as GoogleEmbeddingPayload;
    const rawValues = this.extractValues(payload);
    if (!rawValues) {
      throw new EmbeddingRuntimeError("Google embeddings response did not include vector values.");
    }

    const numericValues = rawValues.map((value) => Number(value));
    if (!numericValues.every((value) => Number.isFinite(value))) {
      throw new EmbeddingRuntimeError("Google embeddings response included invalid vector values.");
    }

    return normalizeVector(numericValues);
  }

  private extractValues(payload: GoogleEmbeddingPayload): unknown[] | null {
    if (Array.isArray(payload.embedding?.values)) {
      return payload.embedding.values;
    }

    if (Array.isArray(payload.embeddings) && payload.embeddings.length > 0 && Array.isArray(payload.embeddings[0]?.values)) {
      return payload.embeddings[0].values ?? null;
    }

    return null;
  }
}

class OpenAiEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async embed(text: string, _task: EmbeddingTask): Promise<number[]> {
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: this.model,
          input: text
        })
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      throw new EmbeddingRuntimeError(`OpenAI embeddings request failed: ${message}`);
    }

    if (!response.ok) {
      throw new EmbeddingRuntimeError(`OpenAI embeddings request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as OpenAiEmbeddingPayload;
    const rawValues = payload.data?.[0]?.embedding;
    if (!Array.isArray(rawValues)) {
      throw new EmbeddingRuntimeError("OpenAI embeddings response did not include vector values.");
    }

    const numericValues = rawValues.map((value) => Number(value));
    if (!numericValues.every((value) => Number.isFinite(value))) {
      throw new EmbeddingRuntimeError("OpenAI embeddings response included invalid vector values.");
    }

    return normalizeVector(numericValues);
  }
}

function createEmbeddingProviderFromEnv(): EmbeddingProvider {
  const provider = String(process.env.CLAWOS_EMBEDDING_PROVIDER ?? "local").trim().toLowerCase();

  if (provider === "local" || provider === "mock" || provider === "deterministic") {
    return new LocalEmbeddingProvider();
  }

  if (provider === "google") {
    const apiKey = process.env.GOOGLE_API_KEY?.trim();
    if (!apiKey) {
      throw new EmbeddingConfigurationError("Set GOOGLE_API_KEY when CLAWOS_EMBEDDING_PROVIDER=google.");
    }

    return new GoogleEmbeddingProvider(apiKey);
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new EmbeddingConfigurationError("Set OPENAI_API_KEY when CLAWOS_EMBEDDING_PROVIDER=openai.");
    }

    return new OpenAiEmbeddingProvider(apiKey);
  }

  throw new EmbeddingConfigurationError(`Unsupported CLAWOS_EMBEDDING_PROVIDER: ${provider}`);
}

export {
  EMBEDDING_VECTOR_DIMENSIONS,
  EmbeddingConfigurationError,
  EmbeddingRuntimeError,
  LocalEmbeddingProvider,
  GoogleEmbeddingProvider,
  OpenAiEmbeddingProvider,
  createEmbeddingProviderFromEnv
};
export type { EmbeddingTask, EmbeddingProvider };
