# UX Guidelines for Non-Technical Users

## UX Goal

ClawOS must feel simple, guided, and low-friction for users without technical background.

## Core Principles

1. Plain language first
   - Avoid technical jargon in primary UI labels and actions
   - Use short actionable text ("Crear agente", "Hablar", "Ver progreso")
2. One clear action per screen
   - Prioritize primary action and hide advanced settings behind "Avanzado"
3. Progressive disclosure
   - Show complexity only when needed
4. Safe defaults
   - Preconfigured secure settings for memory, voice, and access
5. Visible status
   - Always show what each agent is doing in human language
6. Assisted recovery
   - Errors must include what happened, what to do next, and quick fix action

## Friction Budget

For common flows, target:

1. Create first agent in <= 60 seconds
2. Send first voice command in <= 2 taps
3. Find past memory in <= 3 interactions

## Required UX Flows (MVP)

1. Guided onboarding
   - Welcome flow with 3 steps:
     - connect local brain
     - create first agent
     - run first command
2. Agent creation wizard
   - preset personality templates
   - voice preview button
   - permission toggles with simple explanations
3. Global search spotlight
   - natural language query
   - clear source attribution ("lo encontró Lince ayer")
4. Voice mode
   - clear mic state (listening, processing, speaking)
   - auto-send on silence with cancel option

## Accessibility Baseline

1. Keyboard navigable primary actions
2. Sufficient color contrast
3. Text alternatives for audio output
4. Mobile-first layout and tap targets

## UX Acceptance Criteria

1. New user completes onboarding without docs
2. No critical flow requires manual file editing
3. Error messages include recovery action
4. Playwright E2E covers onboarding and first successful command

