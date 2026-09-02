# Agent instructions — SkillForge

SkillForge is a personal skills & career copilot: a Next.js web app whose core is an **AI agent** that knows the user's real profile (stack, skills with levels, goal), answers in that context, and proposes concrete learning steps. Chat responses stream, the system prompt is generated from the profile, memory persists across sessions, and later the agent calls its own tools.

This project is built **step by step, as a course**. Read the rules below before proposing or writing anything.

## 1. Requirements are the single source of truth

- **`docs/requirements.md` is the single source of truth** for what we build. Read it before proposing or writing code — it defines the phases, what is in scope now, and what is explicitly deferred.
- If the chat conversation conflicts with `docs/requirements.md`, **the file wins** until it is updated.
- **When direction changes, update `docs/requirements.md` in the same step as the code.** Never leave a decision only in the conversation: update the affected phase, any non-functional requirement it touches, and the date/current phase header.
- A deferred requirement is never silently dropped — move it to a later phase or to the "Non-scop" section so the decision leaves a trace.
- Do not copy requirements into `README.md`. `README.md` stays short and links to `docs/requirements.md`.

## 2. External integrations must document the manual steps

**Fixed rule: every new external integration ships with `docs/<integration>/README.md`.** This applies to LLM providers, databases, authentication, deploy targets, and monitoring/observability services — anything that requires an account or a dashboard.

The agent writes the code; the manual steps are forgotten immediately if nobody writes them down — on reinstall, on another machine, or at deploy time they have to be rediscovered from scratch.

Required sections (see `docs/_template-integrare.md`):

1. What this integration is used for in SkillForge, and in which phase it was added.
2. Where to create the account, and which plan is needed.
3. Where exactly the API key / credentials are generated (menu path in their UI).
4. Which environment variable it goes into, and whether it is server-only.
5. What must be configured in their dashboard (project settings, allowed domains, quotas, webhooks, policies).
6. Cost: pricing model, free-tier limits, what drives the bill.
7. How to verify it works (a concrete check with an expected result).
8. What to redo on reinstall / on another machine / at deploy.
9. Troubleshooting: the errors this integration actually produces.

**Never write real keys, tokens, connection strings, or account identifiers in documentation — only variable names and where to obtain the values.** Write these docs in Romanian (they are for the user), like every other file under `docs/`.

## 3. Secrets

- API keys are used **only** in server-side code (Route Handlers). Never in client components, never in a URL, never in logs or error messages shown to the user, never committed.
- Only server-side variables hold secrets. Anything named `NEXT_PUBLIC_*` is public by definition — never put a secret there.
- Every new variable is added to `.env.example` with a placeholder value and a one-line comment, and is documented in the relevant `docs/<integration>/README.md`.
- `.env.local` and any other real env file stay ignored by git. If a key has ever been exposed, say so and revoke/regenerate it — do not just delete the line.

## 4. Course working rhythm

- **Small steps, one new concept per step.** Do not implement future phases in advance, and do not add libraries, abstractions, or configuration a later phase will need.
- Prefer the simplest thing that satisfies the current phase's "gata când" (done-when) criterion.
- At the end of every step, explain in plain language: **what was added, why it was needed, and what the user should look at to see it working.** This project is a learning tool — an unexplained change is an incomplete change.
- Do not scaffold generated boilerplate the phase does not need. Delete generated files that serve no purpose.
- When a step touches an integration, do the code and its `docs/<integration>/README.md` in the same step.

## 5. Tech stack (fixed — see `docs/requirements.md` §4)

- **Next.js (App Router) + TypeScript**, one project for UI and server.
- **Vercel AI SDK** for streaming and provider abstraction.
- LLM calls happen **only** inside Route Handlers (`app/api/*/route.ts`).
- Default provider: **Anthropic (Claude)**. Second provider: OpenAI (phase 4). Provider choice must stay swappable behind one abstraction — no provider SDK calls scattered across the codebase.
- Persistence: `localStorage` in phases 2–5, **Supabase** from phase 6.

## 6. Code conventions

- **Code, comments, identifiers, commit messages and these agent instructions are in English.** Files under `docs/`, `README.md` and UI copy are in **Romanian** — that is what the user reads.
- TypeScript, no `any` in application code. Data crossing the client/server boundary (profile, messages) is validated on the server — it is untrusted input.
- Server-only modules must not be imported from client components; keep the boundary explicit (`"use client"` only where it is needed).
- Keep the model/provider configuration in one module so a provider can be added without touching UI or route logic.
- Directory layout as it grows: `app/` (routes and UI), `app/api/` (Route Handlers), `lib/` (agent, persona building, providers, storage), `docs/` (Romanian documentation), `scripts/` (shell tooling).
- Do not commit anything unless the user asks.

## 7. These instruction files are generated

`AGENTS.md` is the canonical file. `CLAUDE.md` and `.github/copilot-instructions.md` are **generated copies** — do not edit them.

To change conventions: edit `AGENTS.md`, then run

```sh
sh scripts/sync-agent-instructions.sh
```

`sh scripts/sync-agent-instructions.sh --check` verifies the copies are in sync and exits non-zero if they are not.
