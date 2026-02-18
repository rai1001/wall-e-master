# Shared Memory Engine (Hive Mind)

## Decision

Primary engine: LanceDB.
Fallback/adapter option: ChromaDB.

Rationale:
- Local-first performance
- Low operational cost
- Strong vector retrieval with metadata filtering

## Implementation Status (Current)

- Middleware supports dual backend selection via `CLAWOS_MEMORY_BACKEND=json|lancedb`.
- `json` mode preserves lightweight file persistence for local bootstrap environments.
- `lancedb` mode provides local vector table persistence for `add/search/pin`.
- Embedding providers are selectable via `CLAWOS_EMBEDDING_PROVIDER=local|google|openai`.
- Google mode uses Gemini embeddings (`GOOGLE_API_KEY`, optional `GOOGLE_EMBEDDING_MODEL`) and keeps fixed vector dimensionality for stable LanceDB schema.
- OpenAI mode uses `OPENAI_API_KEY` (optional model override `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`).

## Memory Layers

### 1. Embedding Layer

- Default model: `text-embedding-3-small`
- Local alternative: Ollama `nomic-embed-text`
- Purpose: convert raw text into semantic vectors

### 2. Metadata Layer

Each memory chunk stores:
- `agent_id`
- `project_id`
- `source` (`web`, `file`, `chat`, `system`)
- `timestamp`
- `tags`

### 3. Importance Layer

- `priority_score` for ranking
- `access_count` for reinforcement
- `decay_score` for archival candidates
- manual boost with "Pin to Global Memory"

## Ingestion Flow

1. Capture text from:
   - user messages
   - agent findings
   - task outputs
2. Create embedding
3. Attach normalized metadata
4. Store in vector table
5. Update search and rank index

## Retrieval Flow

1. Agent receives command
2. Middleware queries memory with:
   - semantic similarity
   - keyword fallback
   - `project_id` filter
3. Top chunks are summarized into context bridge text
4. Context is injected before model response

## Performance Optimizations

1. Semantic cache
   - return cached answer for near-duplicate queries
2. Hierarchical summaries
   - periodic project summaries (hourly/nightly)
3. Namespace isolation
   - default project scope with explicit global override

## Example Conceptual API

```ts
await memoryBase.add({
  text: "Stripe subscriptions endpoint changed to /v2",
  metadata: {
    agent_id: "sastre-investigador",
    project_id: "saas-project",
    source: "web",
    priority_score: 10
  }
});

const context = await memoryBase.search("stripe subscriptions endpoint", {
  limit: 3,
  where: { project_id: "saas-project" }
});
```
