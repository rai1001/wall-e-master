# ClawOS API Contracts

## Base

- Base URL: `/api`
- Content type: `application/json`
- Auth: bearer token required for non-public endpoints

## Object Contracts

### Agent

```json
{
  "id": "uuid",
  "name": "Lince",
  "role": "Cybersecurity Researcher",
  "personality_path": "/souls/lince.md",
  "voice_id": "elevenlabs_voice_123",
  "skills": ["browser", "terminal", "python"],
  "memory_access": "global",
  "status": "idle"
}
```

### MemoryChunk

```json
{
  "vector": [0.12, -0.43, 0.31],
  "content": "User prefers React over Vue for frontend work",
  "priority_score": 8,
  "access_count": 3,
  "metadata": {
    "agent_id": "sastre-coder",
    "project_id": "proj_001",
    "source": "chat",
    "timestamp": "2026-02-18T00:00:00Z",
    "tags": ["preferences", "frontend"]
  }
}
```

## Endpoints

### `POST /api/agents/spawn`

Create a new sub-agent and generate required profile files.

Request:

```json
{
  "name": "Lince",
  "role": "Cybersecurity Researcher",
  "personality_template": "default-security",
  "voice_id": "elevenlabs_voice_123",
  "skills": ["browser", "terminal", "python"],
  "memory_access": "global"
}
```

Response `201`:

```json
{
  "agent": {
    "id": "1f9f8f52-3308-4c8f-93be-9f812f4a8ccf",
    "name": "Lince",
    "status": "idle"
  },
  "files_created": [
    "/souls/lince.md",
    "/agents/lince.config.json"
  ]
}
```

### `GET /api/memory/search?q=<query>&project_id=<id>&limit=<n>`

Search shared memory across agents using hybrid retrieval (vector + keyword).

Response `200`:

```json
{
  "query": "what stack does the user prefer",
  "results": [
    {
      "content": "User prefers React over Vue for frontend work",
      "score": 0.89,
      "metadata": {
        "agent_id": "sastre-coder",
        "project_id": "proj_001",
        "source": "chat",
        "tags": ["preferences", "frontend"]
      }
    }
  ]
}
```

### `POST /api/memory/ingest`

Ingest new memory events from user or agent activity.

Request:

```json
{
  "content": "OpenClaw websocket endpoint remains on port 18789",
  "metadata": {
    "agent_id": "lince",
    "project_id": "proj_001",
    "source": "web",
    "tags": ["openclaw", "websocket"]
  },
  "priority_score": 9
}
```

Response `202`:

```json
{
  "status": "queued",
  "memory_id": "mem_123"
}
```

### `POST /api/memory/pin`

Boost a memory chunk as persistent global context.

Request:

```json
{
  "memory_id": "mem_123",
  "reason": "critical platform dependency"
}
```

Response `200`:

```json
{
  "memory_id": "mem_123",
  "priority_score": 15,
  "pinned": true
}
```

### `POST /api/agents/handoff`

Transfer context from one agent to another.

Request:

```json
{
  "from_agent_id": "lince",
  "to_agent_id": "sastre",
  "project_id": "proj_001",
  "content": "Update websocket connector to include retry backoff"
}
```

Response `200`:

```json
{
  "status": "transferred",
  "handoff_id": "handoff_456"
}
```

### `POST /api/voice/process`

Receive audio, transcribe it, and route command to active agent.

Request (multipart):
- `audio`: binary
- `agent_id`: string
- `project_id`: string

Response `200`:

```json
{
  "transcript": "resume project status for today",
  "agent_response": "Current status summary generated",
  "tts_audio_url": "/api/voice/output/response_123.mp3"
}
```

### `GET /api/projects/status?project_id=<id>`

Return consolidated status across all sub-agents.

Response `200`:

```json
{
  "project_id": "proj_001",
  "overall_status": "in_progress",
  "agents": [
    { "id": "a1", "name": "Lince", "status": "busy" },
    { "id": "a2", "name": "Sastre", "status": "idle" }
  ],
  "tasks": {
    "todo": 12,
    "doing": 4,
    "done": 18
  },
  "updated_at": "2026-02-18T00:00:00Z"
}
```

### `GET /api/knowledge/feed?project_id=<id>`

Return global discovery feed entries (agent findings timeline).

### `GET /api/knowledge/graph?project_id=<id>`

Return nodes and edges for graph view (agents, findings, and relation links).

## Error Envelope

All non-2xx responses should follow:

```json
{
  "error": {
    "code": "validation_error",
    "message": "voice_id is required",
    "details": {}
  }
}
```
