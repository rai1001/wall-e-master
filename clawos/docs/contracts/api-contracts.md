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

### `GET /api/agents`

Return the current list of known agents.

Response `200`:

```json
{
  "agents": [
    {
      "id": "1f9f8f52-3308-4c8f-93be-9f812f4a8ccf",
      "name": "Lince",
      "role": "Cybersecurity Researcher",
      "personality_path": "/souls/lince.md",
      "voice_id": "voice_researcher",
      "skills": ["browser"],
      "memory_access": "private",
      "status": "idle"
    }
  ]
}
```

### `PATCH /api/agents/:agent_id/status`

Update operational state of an agent (sleep/wake or mark busy).

Request:

```json
{
  "status": "sleeping"
}
```

### `PATCH /api/agents/:agent_id/permissions`

Update skills and memory scope for an existing agent.

Request:

```json
{
  "skills": ["browser", "python"],
  "memory_access": "global"
}
```

Optional header when `CLAWOS_REQUIRE_GLOBAL_MEMORY_APPROVAL=true` and requesting `memory_access=global`:

```text
x-clawos-global-memory-approved: true
```

Response `200`:

```json
{
  "agent": {
    "id": "1f9f8f52-3308-4c8f-93be-9f812f4a8ccf",
    "name": "Lince",
    "skills": ["browser", "python"],
    "memory_access": "global",
    "status": "idle"
  }
}
```

Response `403` (policy denied):

```json
{
  "error": {
    "code": "policy_denied",
    "message": "Global memory elevation requires explicit approval.",
    "details": {
      "taxonomy": "policy",
      "recovery_action": "Set x-clawos-global-memory-approved: true after approving least-privilege impact."
    }
  }
}
```

Response `200`:

```json
{
  "agent": {
    "id": "1f9f8f52-3308-4c8f-93be-9f812f4a8ccf",
    "name": "Lince",
    "status": "sleeping"
  }
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

Request (`application/json`):

```json
{
  "agent_id": "lince",
  "project_id": "proj_001",
  "voice_id": "elevenlabs_voice_123",
  "audio_base64": "UklGRiQAAABXQVZF..."
}
```

Response `200`:

```json
{
  "transcript": "resume project status for today",
  "agent_response": "Current status summary generated",
  "tts_audio_url": "/api/voice/output/response_123.mp3"
}
```

Response `413` (oversized clip):

```json
{
  "error": {
    "code": "payload_too_large",
    "message": "Audio payload exceeds maximum size",
    "details": {
      "limit_bytes": 512000,
      "recovery_action": "Send a shorter audio clip or reduce audio quality."
    }
  }
}
```

Response `429` (rate limited):

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Too many requests. Please wait and retry.",
    "details": {
      "recovery_action": "Wait a few seconds and retry the same action."
    }
  }
}
```

Response `503` (provider configuration):

```json
{
  "error": {
    "code": "provider_configuration_error",
    "message": "Voice providers are not configured correctly",
    "details": {
      "recovery_action": "Set OPENAI_API_KEY when STT_PROVIDER=openai."
    }
  }
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

### `GET /api/security/checklist`

Return automated remote-access readiness checks and guided tunnel commands.

Response `200`:

```json
{
  "generated_at": "2026-02-18T12:00:00Z",
  "overall_status": "review_required",
  "remote_access": {
    "provider": "tailscale",
    "public_url": "https://clawos.usuario.ts.net"
  },
  "checks": [
    {
      "id": "auth_token_not_default",
      "status": "warn",
      "message": "Se esta usando token por defecto (dev-token).",
      "recovery_action": "Define API_BEARER_TOKEN con un valor fuerte."
    },
    {
      "id": "openclaw_local_only",
      "status": "pass",
      "message": "OpenClaw sigue en red local privada.",
      "recovery_action": "Mantener OPENCLAW_WS_URL en localhost o 127.0.0.1."
    }
  ],
  "helper_commands": {
    "tailscale": ["tailscale up", "tailscale funnel 3000"],
    "cloudflare": ["cloudflared tunnel --url http://127.0.0.1:3000"]
  }
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
    "details": {
      "taxonomy": "validation"
    }
  }
}
```

`error.details.taxonomy` classifies failures for observability:

- `auth`
- `validation`
- `policy`
- `resource`
- `throttle`
- `dependency`
- `availability`
- `unknown`
