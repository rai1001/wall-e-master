# ClawOS

Control and Orchestration for OpenClaw.

ClawOS is a visual operating layer for autonomous agents with shared memory, voice-first control, and secure remote access.

## Current Status

Core implementation is active and runnable:

- Middleware APIs for agents, memory, voice, project status/events, security, observability, and costs
- Web app (Next.js) with low-friction views for chat, projects, security, and agent management
- WebSocket bridge to OpenClaw daemon (`ws://127.0.0.1:18789`)
- Shared memory persistence and optional LanceDB backend
- Voice flow with STT/TTS providers and persisted audio output

## Scope

- Visual orchestration interface for multi-agent workflows
- Shared vector memory (Hive Mind) for all agents
- Agent factory with personality, voice, and skills
- Voice pipeline (STT/TTS)
- Secure remote access outside the home network

## Repository Layout

```text
clawos/
  README.md
  apps/
    middleware/
    web/
  docs/
    architecture/
    contracts/
    improvements/
    plans/
    product/
    security/
    testing/
```

## Stack

- Frontend: Next.js 15 (App Router), Tailwind CSS
- Middleware: Node.js + Express
- Vector DB: LanceDB
- Streaming: WebSocket bridge to OpenClaw daemon (port 18789)
- Audio: Whisper for STT, ElevenLabs for TTS
- Remote Access: Tailscale Funnel

## Run Locally

```bash
cd clawos
pnpm install
pnpm --filter @clawos/middleware exec tsx src/server.ts
pnpm --filter @clawos/web dev
```

## Start Here

1. Read `clawos/ITERATION_GUARDRAILS.md` before any iteration
2. Read `clawos/docs/plans/2026-02-18-clawos-design.md`
3. Read `clawos/docs/architecture/memory-engine.md`
4. Read `clawos/docs/prompts/shared-system-prompt.md`
5. Read `clawos/docs/product/ux-guidelines.md`
6. Execute `clawos/docs/plans/2026-02-18-clawos-implementation.md`
7. Track milestones in `clawos/docs/plans/2026-02-18-roadmap-v2.md`
8. Track priorities in `clawos/docs/improvements/backlog.md`
9. Operate with `clawos/docs/operations/runbook.md`
