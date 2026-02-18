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
