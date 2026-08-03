---
title: "Effect Services the opencode Way, Observed via OTEL"
date: "2026-06-22"
description: "Refactoring an Effect 4 CLI into opencode's Context.Service + Layer shape, and watching its spans in a local OTEL viewer."
session: "effect"
tags:
  - "effect"
  - "code"
lessons:
  - title: "Lesson 1 · The opencode module shape: Service + Layer"
    href: "/teach/effect/0001-service-and-layer.html"
  - title: "Lesson 2 · Testing a service by swapping its Layer"
    href: "/teach/effect/0002-testing-a-service.html"
  - title: "Lesson 3 · The majesty of Layers — requirements are just parameters"
    href: "/teach/effect/0003-majesty-of-layers.html"
  - title: "Lesson 4 · Default services — the ones you never provide"
    href: "/teach/effect/0004-default-services.html"
  - title: "Lesson 5 · The Config service — settings as a layer"
    href: "/teach/effect/0005-config-service.html"
  - title: "Lesson 6 · Effect.gen — generators as do-notation"
    href: "/teach/effect/0006-effect-gen.html"
  - title: "Lesson 7 · Telemetry to motel — spans for free"
    href: "/teach/effect/0007-telemetry-motel.html"
  - title: "Lesson 8 · Browse telemetry — reading the waterfall"
    href: "/teach/effect/0008-browse-telemetry.html"
  - title: "Reference · Effect language service (LSP) in VSCode"
    href: "/teach/effect/effect-lsp.html"
  - title: "Reference · The opencode module shape (Effect 4)"
    href: "/teach/effect/effect-opencode-shape.html"
---
## Mission

### Why
You maintain `msk` (a Bun + Effect 4 CLI). You want to write Effect code with
the same structure as `sst/opencode` (the reference you trust), and you want
to *observe* your code running — set up OpenTelemetry locally and browse the
traces your code emits. The concrete deliverable: refactor `~/c/sklls/msk`
into opencode's shape, and watch its spans flow into a local telemetry viewer.

### Success looks like
- You can turn a flat module (`msk/src/skills.ts`) into a `Context.Service` + `Layer`, exported as a namespace module — the opencode idiom.
- You compose your services into a single `AppLayer` / `ManagedRuntime` like opencode's `app-runtime.ts`.
- `motel` runs on your machine and you can point an Effect OTLP exporter at it.
- You run `msk`, then browse its spans (the `Effect.fn("scanSkills")` calls already in your code) in motel's TUI/web UI.
- You can read an opencode module and explain *why* it's shaped that way.

### Constraints
- Stack is fixed: Bun, `effect@^4.0.0-beta`, `@effect/platform-bun`, oxc, jj.
- Short, concise lessons. You already write working Effect 4 — start above beginner level.
- No worktrees.

### Out of scope (for now)
- React/SolidJS UI, the opencode server/TUI, providers, sessions.
- Effect 3 / older `@effect/*` APIs — we target the 4.x `effect/unstable/*` layout.
- Production OTEL backends (Jaeger/Grafana/cloud) — local `motel` only.

## Resources

### Knowledge

- [Kit Langton — "Effect and the Near Inexpressible Majesty of Layers"](https://effect.institute) + [Effect Institute](https://effect.institute)
  The canonical, on-mission framing of Tag/Layer/Service by the author of opencode AND motel. Use for: the mental model (requirements = function parameters; the R slot; test-layers vs vi.mock). Written in Effect 3 — swap `Context.Tag(...)<Self,Shape>()` → `Context.Service<Self,Shape>()("id")`; rest is identical in 4.x. Basis of Lesson 3.
- [Effect docs — Services & Layers](https://effect.website/docs/requirements-management/services/)
  The canonical model for `Context.Service` / `Layer`. Use for: defining and wiring services. Note: site examples are often Effect 3 — adapt imports to the 4.x `effect/unstable/*` layout.
- [Effect docs — Observability / Tracing](https://effect.website/docs/observability/tracing/)
  Spans, `Effect.withSpan`, OTLP exporters. Use for: understanding what `Effect.fn("name")` produces and how spans nest.
- [sst/opencode source — `packages/opencode/src`](https://github.com/sst/opencode) (local: `~/c/open/opencode`)
  The reference implementation you're matching. Use for: the namespace-module + Service/Layer idiom. Key files:
  - `src/skill/index.ts`, `src/skill/discovery.ts` — module shape (the direct parallel to msk's `skills.ts`).
  - `src/effect/app-runtime.ts` — `Layer.mergeAll` → single AppLayer.
  - `packages/core/src/observability.ts` + `observability/otlp.ts` — how they wire OTLP tracing.
- [kitlangton/motel](https://github.com/kitlangton/motel) (local: `~/c/open/motel`)
  Local OTLP ingest + SQLite-backed TUI/web viewer. Use for: the telemetry backend. Endpoints: `http://127.0.0.1:27686/v1/traces` and `/v1/logs`. Press `c` in the TUI for paste-ready Effect/OTEL setup.
- [effect-smol — `Effect-TS/effect-smol`](https://github.com/Effect-TS/effect-smol) (local: `~/c/open/effect-smol`)
  The 4.x beta sources. Use for: ground-truth on `effect/unstable/observability`, `effect/unstable/cli`, `Context.Service` signatures when docs lag the beta.

### Wisdom (Communities)

- [Effect Discord](https://discord.gg/effect-ts)
  High-signal, maintainers active. Use for: "is this the idiomatic 4.x way?" questions the docs can't answer yet.

### Gaps
- No stable, published docs for the `effect@4` beta `unstable/*` namespaces — lean on `effect-smol` source + opencode as worked examples.
