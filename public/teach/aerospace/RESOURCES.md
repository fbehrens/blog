# AeroSpace Layout Resources

## Knowledge

- [AeroSpace Guide: Tree, Layouts, Normalization](https://nikitabobko.github.io/AeroSpace/guide#tree)
  The primary source. Tree model, 4 layouts, the two normalizations, floating windows. Use for: every conceptual claim.
- [AeroSpace Commands reference](https://nikitabobko.github.io/AeroSpace/commands)
  Exact syntax + tree before/after examples for `move`, `join-with`, `layout`, `split`, `resize`, `flatten-workspace-tree`, `balance-sizes`. Use for: keybinding design, exercises.
- [Default config](https://nikitabobko.github.io/AeroSpace/guide#default-config)
  Canonical binding modes (`main`, `service`). Use for: keybinding lessons.
- [i3 User Guide: Tree](https://i3wm.org/docs/userguide.html#tree)
  AeroSpace's tree model is inspired by i3 (note: i3 "container" = AeroSpace "node"). Use for: deeper intuition, older community answers.
- Source: `~/c/open/AeroSpace` (local checkout; `git show v0.20.3-Beta:<path>` = installed version)
  - `Sources/AppBundle/tree/MacWindow.swift` → `unbindAndGetBindingDataForNewTilingWindow`: new-window placement rule
  - `Sources/AppBundle/command/impl/MoveCommand.swift`, `JoinWithCommand.swift`: exact move/join semantics
  - `Sources/AppBundle/tree/normalizeContainers.swift`: flatten + opposite-orientation normalization
  - `Sources/AppBundle/command/impl/LayoutCommand.swift` + `tree/TilingContainer.swift` (`changeOrientation`): layout toggles, ancestor flip
  Use for: edge cases the docs don't spell out.
- [YouTube: AeroSpace guide by Josean Martinez](https://www.youtube.com/watch?v=-FoWClVHG5g)
  Linked from the official README. Use for: seeing the workflow in motion.

## Wisdom (Communities)

- [AeroSpace GitHub Discussions](https://github.com/nikitabobko/AeroSpace/discussions)
  The official community (the project routes issues through Discussions). Use for: "how do I build layout X" questions, showing off configs.

## Gaps
- No official command to print the whole tree → use the dojo windows + in-browser simulator (`assets/tree.js`).
