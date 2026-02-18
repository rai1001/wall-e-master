# ClawOS V2 Backlog and Roadmap

## Priority Model

- P0: mandatory for first usable release
- P1: production readiness and operator quality
- P2: differentiation and scale

## P0 Core Delivery

1. Secure control plane boundary
   - Middleware is only public entrypoint
   - OpenClaw remains local-only
2. WebSocket bridge + resilience
   - Stable stream relay with reconnect/backoff
3. Memory event bus
   - capture -> embed -> index -> rank
4. Context injector
   - automatic memory retrieval before agent response
5. Agent factory (Soul layer)
   - create `SOUL.md`, `IDENTITY.md`, `CONTEXT_BRIDGE.md`
6. Voice MVP
   - STT in + TTS out with per-agent voice id
7. PWA chat + dashboard
   - chat stream, status cards, kanban/timeline

## P1 Production Readiness

1. Inter-agent handoff endpoint and UI action
2. Global discovery feed and graph view
3. Spotlight memory search (`Cmd+K`)
4. Authz policy by agent capability toggles
5. Memory pinning, reinforcement, and decay jobs
6. Observability baseline
   - structured logs, trace ids, error taxonomy

## P2 Differentiation

1. Semantic cache for repeated queries
2. Hierarchical auto-summaries by project
3. Shadow work panel from background logs
4. Cost control widget by agent/project
5. Cloudflare Tunnel one-click setup assistant

## Phase Plan

1. Phase 1: Core backend
   - bridge, memory table, embeddings
2. Phase 2: Agent personalities
   - Soul files and context bridge
3. Phase 3: Frontend and voice
   - chat, dashboard, voice mode
4. Phase 4: Remote connectivity
   - Tailscale/Cloudflare hardening

## Acceptance Gates

1. Security gate
   - no direct OpenClaw exposure
2. Memory gate
   - cross-agent retrieval works by `project_id`
3. Voice gate
   - hands-free voice flow works end-to-end
4. UX gate
   - feed + search + dashboard render live state

