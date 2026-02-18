# ClawOS Design V2 (2026-02-18)

## Objective

Consolidate all approved directions into one executable architecture without losing prior scope.

## Locked Product Shape

1. Brain in home infrastructure:
   - OpenClaw daemon
   - LanceDB shared memory
   - Middleware API
2. Control in hand:
   - Next.js PWA for mobile/web
   - Voice-first controls
3. Secure remote access:
   - Tailscale Funnel primary
   - Cloudflare Tunnel optional fallback
4. Frictionless user experience:
   - understandable by non-technical users
   - minimal steps for core actions

## Architecture Decision

Primary: Next.js frontend + Node.js middleware.
Optional adapter: FastAPI microservice for memory/embedding pipeline if Python tooling becomes preferable.

Why:
- Keeps MVP velocity with one runtime for UI and control plane
- Preserves extension path for Python memory tooling
- Matches current contracts and roadmap work

## System Layers

### 1. Orchestration Layer

- WebSocket bridge to `ws://localhost:18789`
- Streamed status, thought, and action events
- Agent lifecycle and handoff orchestration

### 2. Memory Layer (Hive Mind)

- LanceDB as primary vector memory store
- Hybrid retrieval:
  - semantic similarity
  - keyword/full-text fallback
- Required metadata:
  - `agent_id`, `project_id`, `source`, `timestamp`, `tags`
- Importance model:
  - `priority_score`, reinforcement, decay, pinning

### 3. Agent Layer (Soul Model)

Each agent is generated with:
- `SOUL.md`
- `IDENTITY.md`
- `CONTEXT_BRIDGE.md`

Agents write private logs and contribute distilled findings to global memory.

### 4. UI Layer

- Chat-like orchestration shell
- Project dashboard (kanban/timeline)
- Global discovery feed
- Graph view (agents <-> findings)
- Spotlight search (`Cmd+K`)
- Voice mode with hands-free send
- Guided onboarding wizard
- Plain-language interaction model with hidden advanced controls

### 5. Persistence Layer

- LanceDB for shared memory
- SQLite (Prisma) for session/thread/project indexing and fast history retrieval

## Core Runtime Flows

### Flow A: Silent Memory Bus

1. Agent/user event captured
2. Event embedded and metadata attached
3. Memory indexed in LanceDB
4. Ranked and available to all agents

### Flow B: Proactive Context Injection

1. User addresses agent
2. Middleware queries project namespace + global memory
3. Relevant chunks are summarized
4. Context is injected before model response

### Flow C: Inter-Agent Handoff

1. User or policy triggers transfer from Agent A to Agent B
2. Middleware records handoff event
3. Shared memory is updated with transfer summary
4. Agent B receives bridge context immediately

## Risks and Mitigations

1. Memory noise growth
   - Mitigation: ranking, decay, pinning, and namespace filtering
2. Remote security drift
   - Mitigation: middleware-only exposure and tunnel ACL checks
3. Voice instability
   - Mitigation: STT/TTS adapter abstraction with fallback mode
4. User friction for non-technical users
   - Mitigation: UX guidelines and explicit usability acceptance criteria

## Design Acceptance

This V2 design supersedes the previous design draft and is aligned with:
- updated architecture docs,
- expanded API contracts,
- shared system prompt template,
- iteration guardrails.
