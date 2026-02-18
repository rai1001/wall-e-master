# ClawOS Iteration Guardrails

Read this file before every iteration.

If a planned change conflicts with any rule below, stop and request explicit approval.

## North Star

Build ClawOS as a local-first, secure orchestration layer:
- Brain in home infrastructure
- Control from mobile/web
- Shared memory across agents
- Voice-first interaction

## Non-Negotiable Rules

1. Do not expose OpenClaw directly to the internet.
2. Keep middleware as the only external control plane.
3. Keep memory shared and persistent across agents.
4. Preserve per-agent identity and permission boundaries.
5. Keep remote access tunnel-based (Tailscale or Cloudflare Tunnel).
6. Keep project namespace isolation via `project_id`.
7. Do not remove auditability (logs, status, observability).
8. Keep UI/UX accessible and low-friction for non-technical users.

## Key Architecture Invariants

1. Frontend
   - Next.js PWA
   - Chat orchestration UX with plain language labels
   - Dashboard and status views
   - Guided onboarding and safe defaults
2. Middleware
   - API contracts for agents, memory, voice, project status
   - WebSocket bridge to `ws://localhost:18789`
3. Memory Engine
   - LanceDB primary (ChromaDB optional adapter)
   - Hybrid retrieval: vector + keyword
   - Metadata required: `agent_id`, `project_id`, `source`, `timestamp`
   - Importance ranking with decay + pinning
4. Agent Model
   - `SOUL.md`, `IDENTITY.md`, `CONTEXT_BRIDGE.md`
   - Skill/permission toggles
   - Persistent state after chat closes
5. Voice
   - STT (Whisper/Web Speech API)
   - TTS (ElevenLabs per agent voice)
   - Hands-free mode with silence detection

## Iteration Start Checklist (Mandatory)

- [ ] I reviewed this file before planning changes.
- [ ] I mapped the change to one of the roadmap phases.
- [ ] I confirmed no rule above is violated.
- [ ] I listed tests/validation required for this change.
- [ ] I documented any assumption introduced by this iteration.
- [ ] I verified the flow remains understandable for a non-technical user.

## Roadmap Lock

1. Phase 1: Core backend (WebSocket bridge, memory table, embeddings)
2. Phase 2: Agent personality and context injector
3. Phase 3: Frontend interface and voice controls
4. Phase 4: Remote connectivity and hardening

## Definition of Drift

Treat the change as drift if it:
- bypasses middleware security boundary,
- breaks shared memory behavior,
- introduces cross-project memory leakage,
- removes voice pipeline requirements,
- adds unrelated product scope.

## Decision Log (Append Per Iteration)

Use this format:

```text
Date:
Iteration goal:
Phase:
Rules checked:
Risks:
Validation done:
Outcome:
```

```text
Date: 2026-02-18
Iteration goal: Harden voice/API boundary and keep UX voice flow simple for non-technical users.
Phase: Phase 3 and Phase 4
Rules checked: 1, 2, 5, 6, 7, 8
Risks: In-memory rate limit store is node-local only (not distributed); request logs are baseline and may need additional redaction rules.
Validation done: pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e
Outcome: Added request_id + structured request logs, API rate limiting, voice payload validation (400/413), updated contracts, and UI voice mode with state feedback.
```

```text
Date: 2026-02-18
Iteration goal: Add real voice provider selection and safe configuration handling.
Phase: Phase 3
Rules checked: 1, 2, 6, 7, 8
Risks: External provider runtime depends on network and third-party availability; current TTS response uses base64 data URL for non-mock mode.
Validation done: pnpm --filter @clawos/middleware test voice.providers.test.ts; pnpm --filter @clawos/middleware test
Outcome: Added OpenAI STT and ElevenLabs TTS provider adapters with env-based selection, actionable 503 configuration errors, and updated runbook/contracts.
```

```text
Date: 2026-02-18
Iteration goal: Replace web placeholders with live middleware-backed project/chat data.
Phase: Phase 3
Rules checked: 1, 2, 6, 7, 8
Risks: Web app depends on local middleware availability; proxy routes return 503 recovery messages when middleware is offline.
Validation done: pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added Next.js proxy API routes, connected Projects and Chat views to real middleware endpoints, and added E2E coverage for live data rendering.
```

```text
Date: 2026-02-18
Iteration goal: Implement guided agent creation wizard connected to middleware spawn endpoint.
Phase: Phase 3
Rules checked: 1, 2, 4, 6, 8
Risks: Preset defaults are static and may need tuning per team use case; no agent management list yet after creation.
Validation done: pnpm --filter @clawos/web test:e2e tests/agent-wizard.spec.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added `/agents/new`, `/api/agents/spawn` proxy, non-technical preset/permission form, and E2E verification of spawn payload and success flow.
```

```text
Date: 2026-02-18
Iteration goal: Add agent management list with sleep/wake controls from web UI.
Phase: Phase 3
Rules checked: 1, 2, 4, 6, 8
Risks: Agent registry is currently in-memory for runtime state, so restart clears status list unless agents are respawned.
Validation done: pnpm --filter @clawos/middleware test agents.management.test.ts; pnpm --filter @clawos/web test:e2e tests/agents-management.spec.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added middleware agent list/status APIs, web `/agents` management view, proxy routes, and end-to-end sleep/wake coverage.
```

```text
Date: 2026-02-18
Iteration goal: Add post-creation permission editing for agents (skills and memory scope).
Phase: Phase 3
Rules checked: 1, 2, 4, 6, 8
Risks: Permission edits remain in runtime registry only until persistent storage for registry is implemented.
Validation done: pnpm --filter @clawos/middleware test agents.permissions.test.ts; pnpm --filter @clawos/web test:e2e tests/agents-permissions.spec.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added `/api/agents/:id/permissions` in middleware, web proxy route, permission editor controls in `/agents`, and end-to-end coverage for saving permissions.
```

```text
Date: 2026-02-18
Iteration goal: Persist agent registry state across middleware restarts.
Phase: Phase 3
Rules checked: 1, 2, 4, 6, 8
Risks: Corrupted registry JSON is currently treated as empty registry; no automatic recovery/backup yet.
Validation done: pnpm --filter @clawos/middleware test agent.registry.persistence.test.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Agent registry now reads/writes disk-backed JSON with configurable path, and restart persistence is verified by test.
```

```text
Date: 2026-02-18
Iteration goal: Add non-technical global semantic search with Cmd/Ctrl+K.
Phase: Phase 3
Rules checked: 1, 2, 3, 6, 8
Risks: Broad unscoped global queries can return mixed-project context unless user includes project terms.
Validation done: pnpm --filter @clawos/web test:e2e tests/global-memory-search.spec.ts; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/middleware test
Outcome: Header-level global search launcher + keyboard shortcut now queries shared memory without forced project filter and presents results in plain-language modal UX.
```

```text
Date: 2026-02-18
Iteration goal: Add automated remote-security checklist and guided tunnel helpers.
Phase: Phase 4
Rules checked: 1, 2, 5, 7, 8
Risks: Checklist validates environment posture only; it does not verify external identity policies in Tailscale/Cloudflare dashboards.
Validation done: pnpm --filter @clawos/middleware test security.checklist.test.ts; pnpm --filter @clawos/web test:e2e tests/security-checklist.spec.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added `/api/security/checklist` backend checks, `/security` non-technical web view, and helper command guidance for secure remote access setup.
```

```text
Date: 2026-02-18
Iteration goal: Expand observability with error taxonomy, policy-denial events, and log redaction tests.
Phase: Phase 4
Rules checked: 1, 2, 4, 7, 8
Risks: Taxonomy mapping is code-based and must stay synced when new error codes are introduced.
Validation done: pnpm --filter @clawos/middleware test policy.denial.test.ts observability.redaction.test.ts voice.security.test.ts auth.required.test.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added observability service with sensitive-data redaction, security event logs (`auth_denied`, `rate_limit_denied`, `global_memory_access_denied`), and policy guard for global-memory elevation.
```

```text
Date: 2026-02-18
Iteration goal: Add cost control widget by project and agent for non-technical operations.
Phase: Phase 3
Rules checked: 2, 6, 7, 8
Risks: Cost values are estimated and in-memory baseline; production token accounting integration remains pending.
Validation done: pnpm --filter @clawos/middleware test costs.summary.test.ts; pnpm --filter @clawos/web test:e2e tests/cost-control-widget.spec.ts tests/projects-live-data.spec.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added `/api/costs/summary` API and project UI card to monitor spend, update budgets, and surface per-agent cost + control actions.
```

```text
Date: 2026-02-18
Iteration goal: Add observability dashboard counters and alert-ready status for operators.
Phase: Phase 4
Rules checked: 2, 7, 8
Risks: Counters are currently in-memory and reset on middleware restart.
Validation done: pnpm --filter @clawos/middleware test observability.summary.test.ts; pnpm --filter @clawos/web test:e2e tests/security-checklist.spec.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added `/api/observability/summary` with rolling security/error counters and integrated `Panel de Observabilidad` in `/security`.
```

```text
Date: 2026-02-18
Iteration goal: Implement memory pinning action for reinforcement from chat UI.
Phase: Phase 3
Rules checked: 2, 3, 6, 8
Risks: Pinning is in-memory in current store; reinforcement persistence across process restart requires LanceDB integration.
Validation done: pnpm --filter @clawos/middleware test memory.pin.test.ts; pnpm --filter @clawos/web test:e2e tests/memory-pin.spec.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added middleware + web pin route and chat action to fix key findings into global memory context.
```

```text
Date: 2026-02-18
Iteration goal: Persist observability counters to durable storage across middleware restarts.
Phase: Phase 4
Rules checked: 2, 7, 8
Risks: Persistence relies on local filesystem write access; misconfigured paths can silently reduce historical visibility.
Validation done: pnpm --filter @clawos/middleware test observability.persistence.test.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build; pnpm --package=@redocly/cli dlx redocly lint docs/contracts/openapi.yaml
Outcome: Observability service now loads/saves counters from disk (`CLAWOS_OBSERVABILITY_PATH`/`CLAWOS_OBSERVABILITY_DIR`) with retention pruning and restart persistence covered by regression test.
```

```text
Date: 2026-02-18
Iteration goal: Add non-technical knowledge map clusters to Projects view.
Phase: Phase 3
Rules checked: 2, 3, 6, 8
Risks: Current cluster logic depends on `hands_off` relations and may underrepresent knowledge density if additional edge types are introduced later.
Validation done: pnpm --filter @clawos/web test:e2e tests/knowledge-map.spec.ts; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build
Outcome: Added `/api/knowledge/graph` web proxy and `Mapa de Conocimiento` card with agent/finding counts and per-agent shared-handoff totals.
```

```text
Date: 2026-02-18
Iteration goal: Close remaining middleware/platform gaps (durable stores, real bridge transport, voice output persistence, full taxonomy coverage).
Phase: Phase 1, Phase 3, and Phase 4
Rules checked: 2, 3, 6, 7, 8
Risks: Durable stores currently use JSON files; teams requiring high-volume vector indexing should migrate to LanceDB adapter for scale.
Validation done: pnpm --filter @clawos/middleware test durable.stores.test.ts voice.output.persistence.test.ts taxonomy.coverage.test.ts openclaw.bridge.test.ts; pnpm --filter @clawos/middleware test; pnpm --filter @clawos/web test:e2e; pnpm --filter @clawos/web build; pnpm --package=@redocly/cli dlx redocly lint docs/contracts/openapi.yaml
Outcome: Implemented persistence for memory/knowledge/cost stores, live websocket client transport, persisted TTS output route, and taxonomy-consistent error envelopes across remaining routes.
```
