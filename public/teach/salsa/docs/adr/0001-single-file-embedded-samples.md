# 0001 — Beat Machine uses real one-shot samples, served as plain files

## Status

Accepted (2026-06-12). Supersedes the earlier same-day draft that embedded samples base64 in the HTML — portability as a single artefact turned out not to be a requirement.

## Context

The Beat Machine needs real instrument timbres — synthesized congas/piano defeat ear training — and a continuous BPM slider. Options considered: pure Web Audio synthesis (no assets, fake sound), real one-shot samples (CC0/CC-BY), or reusing salsabeatmachine.org's sample pack (unclear license).

A separate constraint: recorded *phrases* (horns, vocals) only fit one tempo; time-stretching via `playbackRate` detunes them. One-shot hits scheduled by our own clock scale to any BPM. Pitched instruments (piano, bass) can be driven from a single note sample re-pitched via `playbackRate`, sampler-style.

## Decision

`tools/beat-machine/` holds `index.html` plus a `samples/` folder of CC0/CC-BY one-shots (freesound.org-sourced) and macOS `say`-generated count-voice clips. Only one-shot-schedulable instruments are included; Horns and Vocals are excluded from v1.

## Consequences

- The BPM slider stays continuous and honest at any tempo.
- Samples are swappable by replacing a file — no re-encoding step.
- The tool is a folder, not a single file; it needs its `samples/` directory alongside it (still works offline from disk, subject to browser fetch-from-file rules — serve locally if needed).
- Adding Horns/Vocals later requires per-tempo phrase recordings or pitch-preserving stretch, not just more samples.
- Sample attribution (for CC-BY) lives in the folder alongside the samples.
