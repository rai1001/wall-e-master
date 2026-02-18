# Agent Workspace and Soul Layer

## Unified Workspace Pattern

Use a shared knowledge workspace with two memory scopes:

1. Global read memory
   - `GLOBAL_KNOWLEDGE.md` and vector memory namespace `global`
2. Per-agent write memory
   - `agents/<agent_name>/AGENT_LOG.md`

A sync job extracts relevant points from agent logs and publishes them to global memory.

## Agent Identity Files

Each created sub-agent must include:

1. `SOUL.md`
   - tone, style, behavior constraints
2. `IDENTITY.md`
   - role, permissions, hard limits
3. `CONTEXT_BRIDGE.md`
   - mandatory instruction to query shared findings before action

## Suggested Folder Layout

```text
workspace/
  shared/
    GLOBAL_KNOWLEDGE.md
    shared_findings/
  agents/
    lince/
      SOUL.md
      IDENTITY.md
      CONTEXT_BRIDGE.md
      AGENT_LOG.md
    sastre/
      SOUL.md
      IDENTITY.md
      CONTEXT_BRIDGE.md
      AGENT_LOG.md
  projects/
    project-software/
      PROJECT_LOG.md
```

## Inter-Agent Handshake

Support explicit knowledge transfer:

- UI action: drag context block from Agent A to Agent B
- API action: `POST /api/agents/handoff`
- Side effect:
  - write transfer event in both logs
  - publish shared summary to global memory

