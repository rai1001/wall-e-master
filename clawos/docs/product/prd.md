# ClawOS Product Requirements

## Project

- Name: ClawOS (Control and Orchestration for OpenClaw)
- Vision: Build a visual operating system for autonomous agents where memory is shared, voice is primary, and remote access is secure from anywhere.

## Primary Objectives

1. Visual orchestration for multiple OpenClaw sub-agents
2. Shared persistent vector memory (Hive Mind)
3. Agent factory with personality, voice, and skill profile
4. Secure remote omnipresence with voice control

## Personas

### The Architect

- Builds complex projects and delegates to specialist sub-agents
- Needs transparency, control, and memory continuity across agents

### The Mobile User

- Checks status and gives commands from mobile
- Needs low-friction voice controls and secure remote access

### The Non-Technical Operator

- Uses ClawOS for outcomes, not for engineering internals
- Needs guided flows, plain language, and recoverable errors

## Core Features

1. Project Dashboard
   - Real-time Kanban and timeline view
   - Cross-agent task progress
   - Cost widget by agent and project
2. Thought Terminal
   - Separate and display agent thinking vs acting
3. Multimodal Voice Module
   - STT input pipeline
   - TTS output per agent voice profile
   - Hands-free mode with silence detection
   - Agent activation by name
4. Semantic Search
   - Natural language search across global memory
   - Spotlight-style global lookup
5. Secure Tunnel
   - Remote access through Tailscale Funnel
   - Optional Cloudflare Tunnel fallback
6. Hive UI
   - Global discovery feed
   - Graph view of agent knowledge flow
   - Inter-agent handoff action
7. Frictionless UX Layer
   - Guided onboarding for first use
   - Plain-language labels and actions
   - Advanced settings hidden by default

## Functional Requirements

1. Spawn and manage agent identities with profiles:
   - `name`, `role`, `personality_path`, `voice_id`, `skills`, `memory_access`, `status`
2. Persist memory chunks in LanceDB with:
   - vector embedding
   - content
   - metadata (`agent_id`, `project_id`, `source`, `timestamp`, `tags`)
   - priority and reinforcement score
3. Provide middleware APIs:
   - `POST /api/agents/spawn`
   - `GET /api/memory/search`
   - `POST /api/memory/ingest`
   - `POST /api/memory/pin`
   - `POST /api/agents/handoff`
   - `POST /api/voice/process`
   - `GET /api/projects/status`
   - `GET /api/knowledge/feed`
   - `GET /api/knowledge/graph`
4. Stream OpenClaw activity through WebSockets from middleware
5. Support mobile-first use for status checks and voice commands
6. Generate and maintain per-agent files:
   - `SOUL.md`
   - `IDENTITY.md`
   - `CONTEXT_BRIDGE.md`
7. Provide non-technical UX safeguards:
   - no critical flow requires manual file editing
   - errors include clear recovery action

## Non-Functional Requirements

1. Security
   - Zero-trust style remote access
   - Secrets never committed
   - Auth required for all write actions
2. Reliability
   - Recoverable from middleware restarts
   - Durable memory write behavior
3. Observability
   - Structured logs with request and correlation ids
   - Health endpoints for critical services
4. Performance
   - Memory search responses target under 500 ms for baseline dataset
5. Usability
   - first agent creation under 60 seconds for a new user
   - first voice command within 2 taps from home screen
   - first memory lookup within 3 interactions

## Success Metrics

1. Agent spawn and activation under 3 seconds
2. Voice command to agent response under 5 seconds median
3. Global semantic memory hit quality acceptable in user acceptance tests
4. Remote access setup reproducible in under 30 minutes
5. New non-technical user completes onboarding without external documentation
