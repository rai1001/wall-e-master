# ClawOS MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an MVP of ClawOS with agent orchestration UI, middleware contracts, shared vector memory, voice pipeline, and secure remote-ready baseline.

**Architecture:** Use a monorepo with `apps/web` (Next.js) and `apps/middleware` (Express), plus shared contracts/config packages. Integrate OpenClaw daemon over WebSocket and persist shared memory in LanceDB.

**Tech Stack:** Next.js 15, Tailwind CSS, Node.js/Express, LanceDB, WebSockets, Whisper STT, ElevenLabs TTS, Playwright, Vitest, Supertest.

---

### Task 1: Monorepo Skeleton and Tooling

**Files:**
- Create: `clawos/package.json`
- Create: `clawos/pnpm-workspace.yaml`
- Create: `clawos/tsconfig.base.json`
- Create: `clawos/apps/web/package.json`
- Create: `clawos/apps/middleware/package.json`
- Test: `clawos/apps/middleware/src/__tests__/smoke.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";

describe("workspace smoke", () => {
  it("loads test runtime", () => {
    expect(true).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @clawos/middleware test`
Expected: FAIL because scripts and dependencies are not installed yet

**Step 3: Write minimal implementation**

- Add workspace package manifests and test scripts
- Add vitest dependency for middleware workspace

**Step 4: Run test to verify it passes**

Run: `pnpm install && pnpm --filter @clawos/middleware test`
Expected: PASS for smoke test

**Step 5: Commit**

```bash
git add clawos/package.json clawos/pnpm-workspace.yaml clawos/tsconfig.base.json clawos/apps/web/package.json clawos/apps/middleware/package.json clawos/apps/middleware/src/__tests__/smoke.test.ts
git commit -m "chore: scaffold clawos monorepo and test runtime"
```

### Task 2: Middleware Boot and Health Endpoints

**Files:**
- Create: `clawos/apps/middleware/src/server.ts`
- Create: `clawos/apps/middleware/src/app.ts`
- Create: `clawos/apps/middleware/src/routes/health.ts`
- Test: `clawos/apps/middleware/src/__tests__/health.test.ts`

**Step 1: Write the failing test**

```ts
import request from "supertest";
import { app } from "../app";

it("returns liveness and readiness", async () => {
  const live = await request(app).get("/health/live");
  const ready = await request(app).get("/health/ready");
  expect(live.status).toBe(200);
  expect(ready.status).toBe(200);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @clawos/middleware test health.test.ts`
Expected: FAIL because app and routes do not exist

**Step 3: Write minimal implementation**

- Express app factory
- `GET /health/live`
- `GET /health/ready`

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @clawos/middleware test health.test.ts`
Expected: PASS with both endpoints returning 200

**Step 5: Commit**

```bash
git add clawos/apps/middleware/src/app.ts clawos/apps/middleware/src/server.ts clawos/apps/middleware/src/routes/health.ts clawos/apps/middleware/src/__tests__/health.test.ts
git commit -m "feat: add middleware boot with health endpoints"
```

### Task 3: Agent Spawn Contract and Endpoint

**Files:**
- Create: `clawos/packages/contracts/src/agent.ts`
- Create: `clawos/apps/middleware/src/routes/agents.ts`
- Create: `clawos/apps/middleware/src/services/agent-factory.ts`
- Test: `clawos/apps/middleware/src/__tests__/agents.spawn.test.ts`

**Step 1: Write the failing test**

```ts
it("creates an agent and returns 201", async () => {
  const payload = {
    name: "Lince",
    role: "Cybersecurity Researcher",
    voice_id: "voice_1",
    skills: ["browser"],
    memory_access: "global"
  };
  const res = await request(app).post("/api/agents/spawn").send(payload);
  expect(res.status).toBe(201);
  expect(res.body.agent.name).toBe("Lince");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @clawos/middleware test agents.spawn.test.ts`
Expected: FAIL because route and factory are missing

**Step 3: Write minimal implementation**

- Contract type definitions
- Input validation
- In-memory factory implementation for first pass

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @clawos/middleware test agents.spawn.test.ts`
Expected: PASS with `201` response

**Step 5: Commit**

```bash
git add clawos/packages/contracts/src/agent.ts clawos/apps/middleware/src/routes/agents.ts clawos/apps/middleware/src/services/agent-factory.ts clawos/apps/middleware/src/__tests__/agents.spawn.test.ts
git commit -m "feat: implement agent spawn endpoint and contracts"
```

### Task 4: LanceDB Memory Search Endpoint

**Files:**
- Create: `clawos/apps/middleware/src/services/memory-store.ts`
- Create: `clawos/apps/middleware/src/routes/memory.ts`
- Test: `clawos/apps/middleware/src/__tests__/memory.search.test.ts`

**Step 1: Write the failing test**

```ts
it("returns ranked semantic results", async () => {
  const res = await request(app).get("/api/memory/search?q=react");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.results)).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @clawos/middleware test memory.search.test.ts`
Expected: FAIL because route/store are missing

**Step 3: Write minimal implementation**

- Add memory service abstraction with mock implementation
- Return deterministic ranked sample for first iteration

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @clawos/middleware test memory.search.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add clawos/apps/middleware/src/services/memory-store.ts clawos/apps/middleware/src/routes/memory.ts clawos/apps/middleware/src/__tests__/memory.search.test.ts
git commit -m "feat: add memory search endpoint with service abstraction"
```

### Task 5: OpenClaw WebSocket Bridge

**Files:**
- Create: `clawos/apps/middleware/src/services/openclaw-bridge.ts`
- Create: `clawos/apps/middleware/src/ws/client-stream.ts`
- Test: `clawos/apps/middleware/src/__tests__/openclaw.bridge.test.ts`

**Step 1: Write the failing test**

```ts
it("reconnects after websocket disconnect", async () => {
  const bridge = new OpenClawBridge({ url: "ws://localhost:18789" });
  const state = await bridge.simulateDisconnectAndRecover();
  expect(state.recovered).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @clawos/middleware test openclaw.bridge.test.ts`
Expected: FAIL because bridge implementation is missing

**Step 3: Write minimal implementation**

- Create websocket client with exponential backoff reconnect
- Expose bridge events for UI streaming

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @clawos/middleware test openclaw.bridge.test.ts`
Expected: PASS with reconnect behavior

**Step 5: Commit**

```bash
git add clawos/apps/middleware/src/services/openclaw-bridge.ts clawos/apps/middleware/src/ws/client-stream.ts clawos/apps/middleware/src/__tests__/openclaw.bridge.test.ts
git commit -m "feat: add websocket bridge with reconnect policy"
```

### Task 6: Voice Process Endpoint (STT to TTS)

**Files:**
- Create: `clawos/apps/middleware/src/routes/voice.ts`
- Create: `clawos/apps/middleware/src/services/stt-provider.ts`
- Create: `clawos/apps/middleware/src/services/tts-provider.ts`
- Test: `clawos/apps/middleware/src/__tests__/voice.process.test.ts`

**Step 1: Write the failing test**

```ts
it("processes audio and returns transcript plus tts output", async () => {
  const res = await request(app).post("/api/voice/process");
  expect(res.status).toBe(200);
  expect(res.body.transcript).toBeDefined();
  expect(res.body.tts_audio_url).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @clawos/middleware test voice.process.test.ts`
Expected: FAIL because endpoint and providers are missing

**Step 3: Write minimal implementation**

- Add provider interfaces with mock adapters
- Parse multipart and return mock transcript/tts URL

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @clawos/middleware test voice.process.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add clawos/apps/middleware/src/routes/voice.ts clawos/apps/middleware/src/services/stt-provider.ts clawos/apps/middleware/src/services/tts-provider.ts clawos/apps/middleware/src/__tests__/voice.process.test.ts
git commit -m "feat: add voice process endpoint with provider interfaces"
```

### Task 7: Next.js UI Baseline (Chat, Dashboard, Thought Terminal)

**Files:**
- Create: `clawos/apps/web/app/page.tsx`
- Create: `clawos/apps/web/app/projects/page.tsx`
- Create: `clawos/apps/web/components/chat-shell.tsx`
- Create: `clawos/apps/web/components/thought-terminal.tsx`
- Test: `clawos/apps/web/tests/smoke.spec.ts`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("renders primary navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("ClawOS")).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @clawos/web test:e2e`
Expected: FAIL because app and test setup are incomplete

**Step 3: Write minimal implementation**

- Build landing shell with navigation to dashboard and thought terminal
- Add placeholder cards for live project status

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @clawos/web test:e2e`
Expected: PASS for smoke navigation test

**Step 5: Commit**

```bash
git add clawos/apps/web/app/page.tsx clawos/apps/web/app/projects/page.tsx clawos/apps/web/components/chat-shell.tsx clawos/apps/web/components/thought-terminal.tsx clawos/apps/web/tests/smoke.spec.ts
git commit -m "feat: scaffold clawos web interface baseline"
```

### Task 8: Security and Contract Validation Pipeline

**Files:**
- Create: `clawos/.github/workflows/ci.yaml`
- Create: `clawos/apps/middleware/src/middleware/auth.ts`
- Modify: `clawos/docs/contracts/openapi.yaml`
- Test: `clawos/apps/middleware/src/__tests__/auth.required.test.ts`

**Step 1: Write the failing test**

```ts
it("rejects protected endpoint without token", async () => {
  const res = await request(app).get("/api/projects/status?project_id=proj_001");
  expect(res.status).toBe(401);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @clawos/middleware test auth.required.test.ts`
Expected: FAIL because auth middleware is not active

**Step 3: Write minimal implementation**

- Add bearer auth middleware
- Wire middleware to protected `/api` routes
- Add CI checks for tests and OpenAPI lint

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @clawos/middleware test auth.required.test.ts`
Expected: PASS with `401` unauthorized response

**Step 5: Commit**

```bash
git add clawos/.github/workflows/ci.yaml clawos/apps/middleware/src/middleware/auth.ts clawos/apps/middleware/src/__tests__/auth.required.test.ts clawos/docs/contracts/openapi.yaml
git commit -m "feat: enforce api auth and add CI validation gates"
```

### Task 9: Documentation Sync and Operational Runbook

**Files:**
- Create: `clawos/docs/operations/runbook.md`
- Modify: `clawos/README.md`
- Modify: `clawos/docs/security/remote-access-and-hardening.md`
- Modify: `clawos/docs/testing/test-strategy.md`

**Step 1: Write the failing test**

No code test. Use doc validation check.

**Step 2: Run validation to verify it fails**

Run: `rg "PLACEHOLDER_MARKER" clawos/docs --glob '!clawos/docs/plans/2026-02-18-clawos-implementation.md'`
Expected: output includes unresolved placeholders if any remain

**Step 3: Write minimal implementation**

- Fill runbook for startup, health checks, and incident response
- Remove unresolved placeholders in docs

**Step 4: Run validation to verify it passes**

Run: `rg "PLACEHOLDER_MARKER" clawos/docs --glob '!clawos/docs/plans/2026-02-18-clawos-implementation.md'`
Expected: no output

**Step 5: Commit**

```bash
git add clawos/docs/operations/runbook.md clawos/README.md clawos/docs/security/remote-access-and-hardening.md clawos/docs/testing/test-strategy.md
git commit -m "docs: finalize runbook and sync implementation documentation"
```

## Risks and Mitigations

1. External provider instability (STT/TTS)
   - Mitigation: timeout controls, retries, and graceful fallback messaging
2. WebSocket daemon disconnect loops
   - Mitigation: exponential backoff + health state in dashboard
3. Memory quality drift
   - Mitigation: metadata normalization and periodic retrieval quality checks
4. Security misconfiguration in remote access
   - Mitigation: mandatory security checklist before exposure

## Validation Checklist

1. Unit tests pass for middleware services
2. Integration tests pass for memory and websocket bridge
3. E2E smoke passes for UI flows
4. OpenAPI lints cleanly
5. Protected endpoints reject anonymous requests

## Immediate Next Action

Start Task 1 and complete commit-by-commit execution with `superpowers:executing-plans`.

## V2 Delta Tasks (Consolidated Scope)

### Task 10: Memory Event Bus and Ranking

**Files:**
- Create: `clawos/apps/middleware/src/services/memory-event-bus.ts`
- Modify: `clawos/apps/middleware/src/services/memory-store.ts`
- Test: `clawos/apps/middleware/src/__tests__/memory.ingest.test.ts`

**Step 1: Write the failing test**
- Verify `POST /api/memory/ingest` queues and persists a chunk with metadata.

**Step 2: Run test to verify it fails**
- `pnpm --filter @clawos/middleware test memory.ingest.test.ts`

**Step 3: Write minimal implementation**
- Add ingest pipeline with:
  - metadata normalization
  - `priority_score`
  - `access_count`
- Implement `POST /api/memory/ingest`.

**Step 4: Run test to verify it passes**
- Endpoint returns `202` and memory id.

**Step 5: Commit**
- `feat: add memory ingest bus and ranking fields`

### Task 11: Agent Soul Files and Factory Expansion

**Files:**
- Modify: `clawos/apps/middleware/src/services/agent-factory.ts`
- Create: `clawos/apps/middleware/src/templates/SOUL.md`
- Create: `clawos/apps/middleware/src/templates/IDENTITY.md`
- Create: `clawos/apps/middleware/src/templates/CONTEXT_BRIDGE.md`
- Test: `clawos/apps/middleware/src/__tests__/agent.factory.files.test.ts`

**Step 1: Write the failing test**
- Spawn endpoint must create all three agent identity files.

**Step 2: Run test to verify it fails**
- `pnpm --filter @clawos/middleware test agent.factory.files.test.ts`

**Step 3: Write minimal implementation**
- Add template rendering and file generation in spawn flow.

**Step 4: Run test to verify it passes**
- Verify files exist and include expected placeholders.

**Step 5: Commit**
- `feat: generate SOUL identity and context bridge files on spawn`

### Task 12: Handoff + Feed + Graph Contracts

**Files:**
- Create: `clawos/apps/middleware/src/routes/handoff.ts`
- Create: `clawos/apps/middleware/src/routes/knowledge.ts`
- Modify: `clawos/apps/middleware/src/app.ts`
- Test: `clawos/apps/middleware/src/__tests__/handoff-and-feed.test.ts`

**Step 1: Write the failing test**
- Verify handoff transfer response and feed/graph query endpoints.

**Step 2: Run test to verify it fails**
- `pnpm --filter @clawos/middleware test handoff-and-feed.test.ts`

**Step 3: Write minimal implementation**
- Add:
  - `POST /api/agents/handoff`
  - `GET /api/knowledge/feed`
  - `GET /api/knowledge/graph`

**Step 4: Run test to verify it passes**
- Endpoints return valid response shapes.

**Step 5: Commit**
- `feat: add handoff and knowledge feed/graph endpoints`

### Task 13: Shared System Prompt Injection

**Files:**
- Create: `clawos/apps/middleware/src/prompts/shared-system-prompt.ts`
- Modify: `clawos/apps/middleware/src/services/openclaw-bridge.ts`
- Reference: `clawos/docs/prompts/shared-system-prompt.md`
- Test: `clawos/apps/middleware/src/__tests__/prompt.injection.test.ts`

**Step 1: Write the failing test**
- Verify active agent request includes memory-bridge prompt segment.

**Step 2: Run test to verify it fails**
- `pnpm --filter @clawos/middleware test prompt.injection.test.ts`

**Step 3: Write minimal implementation**
- Load prompt template, interpolate variables, prepend to request context.

**Step 4: Run test to verify it passes**
- Prompt section present and project namespace filter enforced.

**Step 5: Commit**
- `feat: inject shared system prompt with project scoped memory bridge`

### Task 14: Frictionless UX for Non-Technical Users

**Files:**
- Create: `clawos/apps/web/app/onboarding/page.tsx`
- Create: `clawos/apps/web/components/quick-actions.tsx`
- Create: `clawos/apps/web/components/recovery-banner.tsx`
- Test: `clawos/apps/web/tests/non-technical-onboarding.spec.ts`
- Reference: `clawos/docs/product/ux-guidelines.md`

**Step 1: Write the failing test**
- Validate a new user can:
  - complete onboarding,
  - create first agent,
  - run first command without touching advanced settings.

**Step 2: Run test to verify it fails**
- `pnpm --filter @clawos/web test:e2e non-technical-onboarding.spec.ts`

**Step 3: Write minimal implementation**
- Add 3-step onboarding flow
- Add plain-language quick actions on home screen
- Add recovery banner with action-oriented error text

**Step 4: Run test to verify it passes**
- onboarding spec passes and primary flow works on mobile viewport

**Step 5: Commit**
- `feat: add onboarding and low-friction ux for non-technical users`
