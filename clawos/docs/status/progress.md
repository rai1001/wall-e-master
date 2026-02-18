# ClawOS Progress Status

Last update: 2026-02-18

## Completed

1. Core middleware API with auth boundary and OpenClaw bridge scaffolding
2. Shared memory ingest/search pipeline with priority ranking fields
3. Agent factory with `SOUL.md`, `IDENTITY.md`, and `CONTEXT_BRIDGE.md`
4. Shared system prompt injection for project-scoped memory retrieval
5. Non-technical onboarding flow and quick actions UI
6. Knowledge handoff/feed/graph contracts and endpoints
7. Voice/API hardening baseline:
   - request_id response header
   - structured request logging
   - rate limiting (`429`)
   - voice payload validation (`400` / `413`)
8. Voice mode UX component with clear states (escuchando/procesando/hablando) and cancel action
9. Voice provider registry baseline:
   - `STT_PROVIDER=mock|openai`
   - `TTS_PROVIDER=mock|elevenlabs`
   - actionable `503` when provider keys are missing
   - optional `voice_id` override on `/api/voice/process`
10. Live web data bindings:
   - `Projects` page now reads `/api/projects/status` through Next.js proxy routes
   - `Chat` now retrieves shared memory context via `/api/memory/search`
   - project namespace filtering enforced in middleware memory search
11. Agent creation wizard:
   - new page `/agents/new` with presets and safe defaults
   - skills and memory permissions toggles for non-technical users
   - proxy route `/api/agents/spawn` connected to middleware
   - E2E coverage for successful agent creation flow
12. Agent management view:
   - backend endpoints `GET /api/agents` and `PATCH /api/agents/:id/status`
   - web page `/agents` to list agents and actions dormir/despertar
   - Next.js proxy routes for list and status updates
   - middleware and E2E tests for full sleep/wake flow
13. Agent permission editing flow:
   - backend endpoint `PATCH /api/agents/:id/permissions`
   - web `/agents` now edits skills and memory scope per agent
   - Next.js proxy route for permission updates
   - middleware and E2E tests for permission-save behavior
14. Agent registry persistence:
   - `AgentRegistry` now persists to disk (`agents-registry.json`)
   - survives middleware restarts when using `CLAWOS_AGENTS_DIR` or `CLAWOS_AGENT_REGISTRY_PATH`
   - persistence regression test covers restart/reload behavior
   - first-run migration bootstraps legacy `*.config.json` agent files into registry
15. Semantic global search (`Cmd+K`) for non-technical users:
   - top-level "Buscar memoria global" launcher in app header
   - keyboard shortcut opens global search dialog (`Ctrl+K` / `Cmd+K`)
   - query runs against `/api/memory/search` without forced `project_id`
   - E2E coverage validates shortcut flow and shared-memory results rendering
16. Remote security checklist automation and deployment helpers:
   - new middleware endpoint `GET /api/security/checklist`
   - automated checks for token strength, daemon locality, tunnel/provider setup, voice keys, and API rate limiting
   - helper command blocks for Tailscale Funnel and Cloudflare Tunnel
   - new `/security` UI view and proxy route for non-technical guided setup
   - middleware and E2E tests covering checklist API and security page rendering

## In Progress

1. Voice provider persistence for generated audio files (replace inline/base64 output strategy)

## Next (Guide-Aligned)

1. Add observability expansion: error taxonomy, policy denial events, and log redaction tests
2. Add cost/control widgets per agent and project
