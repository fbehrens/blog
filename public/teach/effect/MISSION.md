---
public: true
title: "Effect Services the opencode Way, Observed via OTEL"
date: 2026-06-22
description: "Refactoring an Effect 4 CLI into opencode's Context.Service + Layer shape, and watching its spans in a local OTEL viewer."
tags: [effect, code]
---

# Mission: Write Effect code the way opencode does — and see it run via OTEL

## Why
You maintain `msk` (a Bun + Effect 4 CLI). You want to write Effect code with
the same structure as `sst/opencode` (the reference you trust), and you want
to *observe* your code running — set up OpenTelemetry locally and browse the
traces your code emits. The concrete deliverable: refactor `~/c/sklls/msk`
into opencode's shape, and watch its spans flow into a local telemetry viewer.

## Success looks like
- You can turn a flat module (`msk/src/skills.ts`) into a `Context.Service` + `Layer`, exported as a namespace module — the opencode idiom.
- You compose your services into a single `AppLayer` / `ManagedRuntime` like opencode's `app-runtime.ts`.
- `motel` runs on your machine and you can point an Effect OTLP exporter at it.
- You run `msk`, then browse its spans (the `Effect.fn("scanSkills")` calls already in your code) in motel's TUI/web UI.
- You can read an opencode module and explain *why* it's shaped that way.

## Constraints
- Stack is fixed: Bun, `effect@^4.0.0-beta`, `@effect/platform-bun`, oxc, jj.
- Short, concise lessons. You already write working Effect 4 — start above beginner level.
- No worktrees.

## Out of scope (for now)
- React/SolidJS UI, the opencode server/TUI, providers, sessions.
- Effect 3 / older `@effect/*` APIs — we target the 4.x `effect/unstable/*` layout.
- Production OTEL backends (Jaeger/Grafana/cloud) — local `motel` only.
