---
description: Give every live Claude Code session its own left-heavy Herdr workspace with a right-side y file browser, then create a read-only all-session overview workspace.
---

Use the `choopan-operations` skill. Confirm `HERDR_ENV=1`, then inspect `herdr agent list` and explain which live Claude sessions will be rearranged. Preserve all non-Claude panes and do not close anything.

Run:

```bash
node scripts/choopan-layout.mjs
```

The helper is idempotent for sessions it previously arranged on this host. It moves each live Claude agent pane into a dedicated workspace, preserves the Claude pane as the left first child at a 72/28 split, starts `y` in the new right pane, synchronizes local session memory, and creates a fresh read-only `choopan-overview` grid containing all live Herdr-recognized agents.

Report the moved session names, their resulting workspaces, any unnamed Claude agents, skipped sessions, and the overview result. If no Claude sessions are live, do not create any workspace.
