# Mission: Complex layouts in AeroSpace, by hand

## Why
Arrange windows on the fly with AeroSpace, from the keyboard, into any nested layout, without fighting the tool.
Always know in advance where a new window will land and how a `move`/`join-with` will reshape the tree.

## Success looks like
- Predict where a newly opened window lands (before opening it)
- Build a target layout (e.g. big editor left, terminal + browser stacked right) from scratch in < 30 s
- Move windows in/out of nested containers with `move`, `join-with`, and switch `layout`s deliberately
- Own a set of custom keybindings (main + a layout mode) in `~/.config/aerospace/aerospace.toml` (dotfiles)
- Practice in a "dojo": throwaway, colored placeholder windows

## Constraints
- Short, concise sessions; keyboard-driven
- Config lives in dotfiles (`~/c/github/dotfiles/aerospace/aerospace.toml`, symlinked)
- Source of truth: AeroSpace docs + source at `~/c/open/AeroSpace` (sparse checkout, read via `git show HEAD:<path>`)

## Out of scope
- Automatic layout restore / scripting on startup
- Swift internals beyond what explains behaviour
- Status bars, borders, multi-monitor workflows (for now)
