# ClawOS Operations Runbook

## Purpose

Operate ClawOS safely on a local machine where OpenClaw is already installed and running.

## Preconditions

1. OpenClaw daemon active on `ws://127.0.0.1:18789`
2. Middleware and web app dependencies installed
3. `API_BEARER_TOKEN` configured for protected API access
4. Voice provider env configured (or left in mock mode):
   - `STT_PROVIDER=mock|openai`
   - `TTS_PROVIDER=mock|elevenlabs`
   - if `STT_PROVIDER=openai`: `OPENAI_API_KEY`
   - if `TTS_PROVIDER=elevenlabs`: `ELEVENLABS_API_KEY`
5. Agent registry persistence path configured (optional):
   - `CLAWOS_AGENTS_DIR` or `CLAWOS_AGENT_REGISTRY_PATH`
6. Remote access posture inputs configured (recommended):
   - `OPENCLAW_WS_URL` (default `ws://127.0.0.1:18789`)
   - `REMOTE_ACCESS_PROVIDER=none|tailscale|cloudflare`
   - `TAILSCALE_FUNNEL_URL` or `CLOUDFLARE_TUNNEL_URL` when provider is enabled
7. Optional policy hardening:
   - `CLAWOS_REQUIRE_GLOBAL_MEMORY_APPROVAL=true` to require explicit header before global memory elevation

## Startup

From `clawos/`:

```bash
pnpm install
pnpm --filter @clawos/middleware test
pnpm --filter @clawos/web dev
```

In a separate terminal:

```bash
cd clawos
pnpm --filter @clawos/middleware exec tsx src/server.ts
```

## Health Checks

1. Liveness:
   - `GET /health/live` should return `200`
2. Readiness:
   - `GET /health/ready` should return `200`
3. Protected endpoint check:
   - `GET /api/projects/status?project_id=proj_001` without token should return `401`
4. Security checklist check:
   - `GET /api/security/checklist` with token should return `200` and actionable `checks[]`
5. Cost summary check:
   - `GET /api/costs/summary?project_id=proj_001` with token should return `200`
6. Observability dashboard check:
   - `GET /api/observability/summary?window_minutes=60` with token should return `200`

## Authentication Check

Use header:

```text
Authorization: Bearer <API_BEARER_TOKEN>
```

Default local dev token if env not set: `dev-token`.

## Common Incidents

### 1. OpenClaw not reachable

Symptoms:
- bridge reconnect loops
- no streaming events

Actions:
1. verify daemon is running on `127.0.0.1:18789`
2. check local firewall rules
3. restart middleware after daemon is back

### 2. Voice endpoint returns errors

Actions:
1. verify provider mode:
   - `STT_PROVIDER` and `TTS_PROVIDER`
2. verify STT/TTS provider keys
   - `OPENAI_API_KEY` for OpenAI STT
   - `ELEVENLABS_API_KEY` for ElevenLabs TTS
2. check payload size and format
3. confirm provider network access

### 3. Memory search returns empty results

Actions:
1. verify ingest path is writing records
2. verify query includes expected project scope
3. inspect metadata tags and source values

### 4. Agents disappear after middleware restart

Actions:
1. verify `CLAWOS_AGENTS_DIR` or `CLAWOS_AGENT_REGISTRY_PATH` points to writable storage
2. check if `agents-registry.json` exists in configured path
3. restart middleware and confirm `GET /api/agents` returns expected rows

### 5. Remote access checklist reports warnings

Actions:
1. call `GET /api/security/checklist` with bearer token
2. review each `checks[].recovery_action`
3. apply tunnel/provider vars and restart middleware
4. verify `overall_status` changes from `review_required` to `ready_for_remote_access`

### 6. Global memory permission update denied (`403 policy_denied`)

Actions:
1. verify if `CLAWOS_REQUIRE_GLOBAL_MEMORY_APPROVAL=true`
2. resend request with header `x-clawos-global-memory-approved: true` only after approval
3. check logs for `security_event=global_memory_access_denied` entries

### 7. Project cost status becomes `over_budget`

Actions:
1. call `GET /api/costs/summary?project_id=<id>` and identify top spending agents
2. apply mitigation from `control_actions[]`
3. if needed, update budget with `PATCH /api/costs/summary`

### 8. Observability `alert_status=critical`

Actions:
1. call `GET /api/observability/summary?window_minutes=60`
2. review `alerts[]` and top counters (`security_event_counters`, `error_taxonomy_counters`)
3. prioritize auth/policy/rate-limit anomalies before feature work

## Deployment Safety

1. Never expose OpenClaw daemon port directly
2. Expose middleware only via Tailscale or Cloudflare Tunnel
3. Keep auth enabled on all `/api/*` endpoints

## Verification Before Completion

Run:

```bash
pnpm --filter @clawos/middleware test
pnpm --filter @clawos/web test:e2e
pnpm --package=@redocly/cli dlx redocly lint docs/contracts/openapi.yaml
```
