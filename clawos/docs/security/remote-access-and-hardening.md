# Remote Access and Security Baseline

## Objective

Provide secure outside-home access for ClawOS while minimizing attack surface.

Hard rule: never expose OpenClaw daemon directly to the internet.

## Recommended Remote Access

Use Tailscale Funnel as primary ingress.
Use Cloudflare Tunnel as optional fallback ingress.

### Baseline Setup

1. Install Tailscale on the ClawOS host machine
2. Join host and approved client devices to the same tailnet
3. Run middleware behind HTTPS entrypoint
4. Publish only required app port through Funnel
5. Restrict access to approved users/devices in tailnet policy

### Cloudflare Tunnel Fallback

1. Expose middleware service only (not daemon port)
2. Protect with access policy and identity checks
3. Keep daemon bound to localhost/private network

## Security Controls

### Authentication and Authorization

1. Require bearer auth for all `/api/*` endpoints except health checks
2. Enforce per-agent access policy:
   - `global` memory access requires elevated permission
   - `private` memory access isolated by agent and project
3. Rotate auth keys on fixed interval

### Secrets and Keys

1. Store provider keys in environment variables only:
   - `OPENAI_API_KEY`
   - `ELEVENLABS_API_KEY`
2. Never store secrets in Git
3. Use separate keys per environment (`dev`, `staging`, `prod`)

### Transport Security

1. Enforce HTTPS only
2. Use HSTS and secure cookie flags
3. Validate TLS cert chain on external provider calls

### Request Validation

1. Validate all request payloads with schema validation
2. Enforce size limits for audio upload endpoints
3. Apply per-IP and per-token rate limiting

### Observability and Incident Readiness

1. Structured JSON logs with `request_id` and `agent_id`
2. Redact secrets and PII fields in logs
3. Add security events:
   - auth failures
   - rate limit hits
   - policy denial events

## Threat Baseline

1. Token theft
   - Mitigation: short-lived tokens + rotation + device-bound access where possible
2. Prompt injection through memory content
   - Mitigation: memory sanitization and trust labeling
3. Audio abuse (oversized or malformed files)
   - Mitigation: MIME/type checks + max duration and byte limits
4. Unauthorized remote access
   - Mitigation: tailnet ACL and strict funnel exposure policy

## Minimum Security Checklist Before Public Use

- [ ] API auth enforced
- [ ] Tailscale ACL policy reviewed
- [ ] All secrets loaded from env
- [ ] Rate limiting active
- [ ] Log redaction enabled
- [ ] Health and security monitoring active
