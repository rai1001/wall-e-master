# ClawOS Test Strategy

## Testing Goals

1. Validate core orchestration behavior
2. Prevent regressions in shared memory and voice flow
3. Guarantee remote access and auth controls work as expected

## Test Pyramid

### Unit Tests

Focus:
- contract validation
- memory query logic
- voice pipeline adapters
- status aggregation logic

Target:
- Fast execution
- High branch coverage in middleware core services

### Integration Tests

Focus:
- middleware API to LanceDB
- middleware WebSocket relay to OpenClaw daemon mock
- STT/TTS provider adapters with mocked external APIs

Target:
- deterministic and repeatable CI runs

### End-to-End Tests

Focus:
- web chat command workflow
- semantic memory search from UI
- voice command submit and playback response
- dashboard status rendering

Tooling:
- Playwright for browser automation

### Security and Reliability Tests

Focus:
- auth required for protected endpoints
- rate limit behavior
- invalid payload rejection
- reconnect behavior after daemon disconnect

## Initial Test Matrix

1. Agent spawn
   - valid payload returns `201`
   - invalid payload returns `400`
2. Memory search
   - query returns ranked results
   - empty query rejected
3. Voice process
   - valid audio returns transcript and response
   - oversized audio returns validation error
4. Project status
   - aggregates multi-agent states correctly
5. Security
   - no token returns `401` on protected endpoints

## Quality Gates

1. Unit and integration tests must pass before merge
2. E2E smoke must pass on protected branch
3. OpenAPI schema lint must pass

## Suggested Commands (planned)

```bash
# middleware tests
pnpm --filter @clawos/middleware test

# frontend e2e
pnpm --filter @clawos/web test:e2e

# contract lint
pnpm --package=@redocly/cli dlx redocly lint clawos/docs/contracts/openapi.yaml
```
