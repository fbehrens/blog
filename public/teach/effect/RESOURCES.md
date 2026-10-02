# Effect (opencode shape) + OTEL Resources

## Knowledge

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

## Wisdom (Communities)

- [Effect Discord](https://discord.gg/effect-ts)
  High-signal, maintainers active. Use for: "is this the idiomatic 4.x way?" questions the docs can't answer yet.

## Gaps
- No stable, published docs for the `effect@4` beta `unstable/*` namespaces — lean on `effect-smol` source + opencode as worked examples.
