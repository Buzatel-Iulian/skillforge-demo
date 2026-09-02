# Agent instructions — SkillForge

SkillForge is a personal skills & career copilot: a Next.js web app whose core is an **AI agent** that knows the user's real profile (stack, skills with levels, goal), answers in that context, and proposes concrete learning steps. Chat responses stream, the system prompt is generated from the profile, memory persists across sessions, and later the agent gets tools it uses on its own (search the user's notes, update the learning plan).

The LLM is always called **from the server**, through an LLM provider (Anthropic first, then OpenAI) — never from the browser, so the API key never reaches the client.

This project is built **step by step, as a course**. Read the rules below before proposing or writing anything.

## 1. Requirements are the single source of truth

- **`docs/requirements.md` is the single source of truth** for what we build. Read it before proposing or writing code — it defines the phases, what is in scope now, and what is explicitly deferred.
- If the chat conversation conflicts with `docs/requirements.md`, **the file wins** until it is updated.
- **When direction changes, update `docs/requirements.md` in the same step as the code.** Never leave a decision only in the conversation: update the affected phase, any non-functional requirement it touches, and the date/current phase in the header.
- A deferred requirement is never silently dropped — move it to a later phase or to the "Non-scop" section so the decision leaves a trace.
- Do not copy requirements into `README.md`. `README.md` stays short (what it is, how to run it, where the docs are) and links to `docs/requirements.md`.

## 2. External integrations must document the manual steps

**Fixed rule: every new external integration ships with `docs/<integration>/README.md`** — one folder per integration (`docs/anthropic/`, `docs/openai/`, `docs/supabase/`, `docs/vercel/`, `docs/sentry/`, …). This applies to LLM providers, databases, authentication, deploy targets, and monitoring — anything that needs an account, a key, or a dashboard.

The agent writes the code; the manual steps are forgotten immediately if nobody writes them down — on reinstall, on another machine, or at deploy time they have to be rediscovered from scratch.

**In the same commit** that adds the integration:

1. `docs/<integration>/README.md`, using the mandatory sections of `docs/_template/README.md`:
   - **Ce face** — what it is used for in SkillForge, and in which phase it was added.
   - **Cont & chei** — where to create the account, the exact path in their UI to generate the key, which scopes/permissions it needs.
   - **Variabile de mediu** — the EXACT variable name, the file it goes into, and the line added to `.env.example`.
   - **Pași manuali** — what the agent cannot do: clicks in their dashboard, migrations to run, domains or webhooks to add.
   - **Cost & limite** — free tier, rate limits, what is billed, what drives the bill in SkillForge.
   - **Verificare** — the command or screen that proves it works, with the expected result.
2. the row in the index table of `docs/README.md` (`integrare | la ce pas a intrat | link`);
3. the new variables in `.env.example`, with placeholder values only.

**Never write real keys, tokens, connection strings, or account identifiers in `docs/` — only variable names and where to obtain the values.** Real values live only in `.env.local`, which is gitignored.

Everything under `docs/` is written in Romanian — it is for the user.

## 3. Secrets

- API keys are used **only** in server-side code: Route Handlers (`src/app/api/*/route.ts`) and Server Components. Never in client components, never in a URL, never in logs or in error messages shown to the user, never committed.
- In Next.js a variable reaches the browser **only** if its name starts with `NEXT_PUBLIC_`. That prefix means public — never put a secret behind it. (Same trap as `VITE_*` in Vite projects, which are inlined into the bundle at build time.)
- Never return a secret's value in an API response. Report at most whether it is configured (`Boolean(process.env.X)`).
- Every new variable goes into `.env.example` with a placeholder and a one-line comment, and is documented in the relevant `docs/<integration>/README.md`.
- If a key has ever been exposed, say so and have it revoked/regenerated — do not just delete the line.

## 4. Course working rhythm

- **Small steps, one new concept per step.** Do not implement future phases in advance, and do not add libraries, abstractions, or configuration only a later phase needs.
- Prefer the simplest thing that satisfies the current phase's "gata când" (done-when) criterion.
- At the end of every step, explain in plain language: **what was added, why it was needed, and what the user should look at to see it working.** This is a learning project — an unexplained change is an incomplete change.
- Delete generated boilerplate that serves no purpose (unused demo assets, placeholder pages).
- When a step touches an integration, do the code and its `docs/<integration>/README.md` in the same step.

## 5. Tech stack (fixed — see `docs/requirements.md` §4)

- **Next.js 16 (App Router) + TypeScript + React 19**, one project for UI and server. Turbopack is the default bundler; there is no `--turbopack` flag to pass.
- **Tailwind CSS v4** — CSS-first configuration. There is **no `tailwind.config.js`**: the theme lives in `@theme` inside `src/app/globals.css`. Tools that need the theme must be pointed at that stylesheet (see `.prettierrc`).
- **shadcn/ui** for components (`components.json`, style `base-nova`, built on Base UI, `lucide` icons). **Every UI component comes from shadcn (`npx shadcn@latest add <name>`) — do not hand-write component primitives.** Polymorphism uses the `render` prop (Base UI), not `asChild` — and when the rendered element is not a native `<button>` (e.g. a `next/link`), pass `nativeButton={false}` as well, otherwise Base UI warns about lost button semantics.
- **Vercel AI SDK** for streaming and provider abstraction (from the agent phase).
- LLM calls happen **only** inside Route Handlers. Default provider: **Anthropic**; second: OpenAI. Provider choice stays behind one abstraction — no provider SDK calls scattered across the codebase.
- Persistence: `localStorage` first, **Supabase** later.

## 6. Code conventions

- **Code, identifiers, commit messages and these agent instructions are in English.** Everything under `docs/`, `README.md`, and all UI copy is in **Romanian** — that is what the user reads.
- **Comments are in Romanian and explain WHY, not what.** A comment that restates the code (`// incrementează contorul`) is noise; a comment that explains the reason (`// fără "use client" hook-ul ar rula pe server și build-ul cade`) is the point. Every non-trivial file carries at least a short header comment saying why it exists and what it prepares for.
- Structure: `src/app/` (routes, one folder per route), `src/app/api/` (Route Handlers), `src/components/` (own components), `src/components/ui/` (shadcn — do not edit by hand), `src/lib/` (helpers, `cn()`, later the agent/persona/providers), `docs/`, `scripts/`.
- Internal navigation uses `next/link`. Plain `<a>` only for things that are not React routes (API endpoints, external links) — and say why in a comment.
- Server Components are the default; add `"use client"` only where browser state or event handlers are actually needed, and keep those components as small as possible.
- TypeScript: no `any` in application code. Data crossing the client/server boundary (profile, messages) is validated on the server — it is untrusted input.
- Do not commit unless the user asks.

## 7. Formatting is not up for discussion

Prettier is configured from the start so that later steps never argue about spaces and quotes:

- `.prettierrc` holds the fixed config (`printWidth: 120`, `semi: true`, double quotes, `trailingComma: "none"`, `arrowParens: "avoid"`, `endOfLine: "lf"`).
- `prettier-plugin-tailwindcss` reorders Tailwind classes into a canonical order. This is not cosmetics: it makes diffs readable and exposes duplicate classes. Because Tailwind v4 has no config file, the plugin is pointed at the stylesheet via `"tailwindStylesheet": "./src/app/globals.css"` — do not remove that line.
- `.prettierignore` stays **in the project root**, and must be complete: Prettier does not merge ignore files, it uses only the nearest one. Never pass `--ignore-path ../..` in a script.
- **Run `npm run format` at the end of every step that writes code.** `npm run format:check` is the read-only variant (for CI).
- `.vscode/settings.json` is committed on purpose (format on save, Prettier as default formatter) so the whole group has the same setup.

## 8. Definition of done for a step

Before reporting a step as finished:

1. `npm run build` passes;
2. `npm run dev` serves the app and the new thing is visible/verifiable;
3. `npm run format` has been run;
4. `docs/requirements.md` reflects reality (phase, scope, non-functional requirements);
5. any new integration has its `docs/<integration>/README.md` and its index row;
6. the step is explained to the user: what was added and why it was needed.

## 9. These instruction files are generated

`AGENTS.md` is the canonical file. `CLAUDE.md` and `.github/copilot-instructions.md` are **generated copies** — do not edit them.

To change conventions: edit `AGENTS.md`, then run

```sh
sh scripts/sync-agent-instructions.sh
```

`sh scripts/sync-agent-instructions.sh --check` verifies the copies are in sync and exits non-zero if they are not.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
