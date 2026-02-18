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
17. Observability expansion baseline:
   - error taxonomy in API error details (`details.taxonomy`)
   - security event logs for auth denial, rate-limit denial, and policy denial
   - optional policy guard `CLAWOS_REQUIRE_GLOBAL_MEMORY_APPROVAL=true`
   - global-memory elevation now returns `403 policy_denied` without explicit approval header
   - log redaction tests for tokens/audio/api keys in observability pipeline
18. Cost/control widget by project and agent:
   - new middleware endpoint `GET/PATCH /api/costs/summary`
   - per-agent cost breakdown and project budget status (`within_budget|near_limit|over_budget`)
   - guided control actions returned by API for non-technical operators
   - `/projects` now includes `Control de Costos` card with budget update flow
   - middleware and E2E tests for cost summary and budget update behavior
19. Observability dashboard and alert-ready counters:
   - new middleware endpoint `GET /api/observability/summary?window_minutes=<n>`
   - rolling counters for `security_event` and `error_taxonomy`
   - alert status model (`nominal|watch|critical`) plus active `alerts[]`
   - `/security` now includes `Panel de Observabilidad` for non-technical operators
   - middleware and E2E tests for summary counters and UI rendering
20. Memory pinning/reinforcement controls:
   - middleware route `POST /api/memory/pin` now implemented
   - memory store supports pinned chunks with boosted priority score
   - web proxy route `POST /api/memory/pin`
   - chat results now include `Fijar en memoria global` action
   - middleware and E2E tests cover pin success and not-found behavior
21. Durable observability counters:
   - observability counter events now persist to disk and survive middleware restarts
   - configurable storage path via `CLAWOS_OBSERVABILITY_PATH` or `CLAWOS_OBSERVABILITY_DIR`
   - retention pruning now applies to persisted data (24h window)
   - persistence regression test validates module restart/reload behavior
22. Knowledge map visualization for non-technical navigation:
   - new web proxy route `GET /api/knowledge/graph`
   - `/projects` now includes `Mapa de Conocimiento` card with plain-language cluster summary
   - displays agent nodes, connected findings, and per-agent handoff counts
   - E2E coverage validates cluster rendering from graph payload
23. Durable core data stores (memory, knowledge, costs):
   - memory chunks now persist to disk (`CLAWOS_MEMORY_PATH|CLAWOS_MEMORY_DIR`)
   - knowledge handoff feed/graph now persist to disk (`CLAWOS_KNOWLEDGE_PATH|CLAWOS_KNOWLEDGE_DIR`)
   - cost summaries/budgets now persist to disk (`CLAWOS_COSTS_PATH|CLAWOS_COSTS_DIR`)
   - regression tests validate restart persistence for all three stores
24. Voice output persistence:
   - `/api/voice/process` now stores synthesized audio to disk
   - new route `GET /api/voice/output/:fileName` streams persisted mp3 files
   - voice output path configurable via `CLAWOS_VOICE_OUTPUT_DIR`
   - regression test validates file generation and retrieval
25. Error taxonomy completion across middleware routes:
   - all remaining validation/not-found route errors migrated to `buildErrorResponse`
   - taxonomy test validates `details.taxonomy` consistency across agents/handoff/knowledge/projects
26. Real OpenClaw websocket bridge capability:
   - `ClientStream` now uses real websocket transport (`ws` package)
   - `OpenClawBridge.ensureConnected()` supports live daemon connection checks
   - `/api/projects/status?probe=true` exposes bridge connectivity status

## In Progress

1. None

## Next (Guide-Aligned)

1. Optional: introduce LanceDB adapter as storage backend while preserving current API contracts
2. Optional: wire token-accurate cost accounting from model/provider usage telemetry
