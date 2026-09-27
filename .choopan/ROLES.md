# Choopan Persistent Role Registry

This compact registry maps durable specialist functions to their current Herdr runtime bindings. Role definitions survive pane replacement, agent restart, context compaction, and Choopan restart. Herdr remains authoritative for live process state; this file is authoritative for intended function and continuity.

Do not load every role memory file during startup. Reconcile this table with one `herdr agent list`, then read only the roles relevant to the current objective.

## Registry

| Role ID / agent name | Function | Status | Agent kind | Herdr session | Workspace / cwd | Current pane | Native session ref | Restore policy | Memory | Last reconciled |
|---|---|---|---|---|---|---|---|---|---|---|
| choopan | Coordinate work, preserve decisions, and synthesize verified results | planned | claude | default | `<project-root>` | unbound | discover from Herdr | prefer-live-then-native | `.choopan/roles/choopan.md` | 2026-09-27 |

Status values: `planned`, `active`, `paused`, `missing`, `ambiguous`, or `retired`.

Restore policies:

- `prefer-live-then-native`: reuse a live named agent; otherwise use Herdr's native restored session; recreate only if neither exists.
- `fresh-process-same-role`: preserve the role memory but start a fresh agent conversation when the process is missing.
- `manual`: do not recreate or resume without user approval.
- `none`: the role is not persistent and should normally be removed from this registry.

## Registry rules

- Role IDs must be valid Herdr agent names: lowercase, stable, descriptive, and unique within one server.
- Pane IDs and lifecycle states are cached bindings, not durable identities.
- Native session references are local recovery pointers. Never expose them outside the local project or logs unless the user requests it.
- Persistent workspace locations must be project-relative, `~`-relative, or logical labels. Resolve `<project-root>` independently on each host.
- Update bindings after a restore, pane move, agent replacement, or reconciliation.
- Do not silently bind a role to an agent when more than one candidate matches.
- Function changes, promotions, retirements, and session replacements require entries in `.choopan/DECISIONS.md`.
