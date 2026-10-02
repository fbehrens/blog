# Context: Salsa Teaching Workspace

Glossary of terms for this workspace's artifacts and the Beat Machine practice tool. Musical timing terms (tumbao, montuno, clave, campana…) live in [reference/timing-and-counting.html](reference/timing-and-counting.html) — this file does not duplicate them.

## Terms

- **Practice Tool** — an interactive artifact used for open-ended drilling, distinct from a Lesson (one-shot, scoped, sequential) and a Reference (static, printable). Lives in `tools/`.
- **Beat Machine** — the workspace's practice tool: a band of Instruments that loops one 8-count phrase, used to train the ear on where each instrument sits in the count.
- **Instrument** — one voice in the Beat Machine. v1 has eight: Count, Clave, Cowbell, Congas, Timbales, Güiro, Bass, Piano. Horns and Vocals are out of scope (phrase-based, incompatible with a continuous BPM slider).
- **Enabled** — an Instrument's persistent on/off state in the Mix, set by its toggle.
- **Mix** — the set of currently Enabled instruments.
- **Focus** — a temporary lens on one Instrument: all others are silenced but keep their Enabled state; releasing Focus restores the Mix exactly. Focusing a disabled Instrument auto-enables it for the duration. At most one Instrument is focused at a time; focusing another moves the Focus.
- **Pattern** — the fixed canonical rhythm an Instrument plays across the 8-count. One Pattern per Instrument; the only user choice is Clave direction (2-3 or 3-2).
- **Count** — the spoken-voice Instrument announcing "1, 2, 3 — 5, 6, 7" (silent on 4 and 8), matching the On1 lead's steps.
