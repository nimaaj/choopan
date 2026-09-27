# Choopan State

Last updated: 2026-09-27

## Objective

Bootstrap a Claude Code orchestrator named Choopan that coordinates agents inside Herdr while keeping only decision-relevant context in memory.

## Current environment

- Supported target platforms: macOS (`Darwin`) and Linux
- Last inspected host: Linux; macOS execution remains to be validated
- Herdr version: `0.9.1`
- Claude Code version: `2.1.283`
- Claude Herdr integration: current (`v10`)
- Herdr agent skill: not yet installed for Claude Code
- Default Herdr session: stopped at last inspection
- Repository status: this directory was not a Git repository at last inspection
- Available UI tools: `yazi`, `ranger`, `nnn`, `gitui`, `fzf`, `jq`

## Active agents

| Name | Pane | Assignment | State | Worktree | Latest evidence |
|---|---|---|---|---|---|
| choopan | unassigned | orchestration | not started | current directory | `CLAUDE.md` |

## Pending decisions

- Install the Herdr agent skill globally or project-locally. Global is recommended if Choopan will control multiple repositories.
- Decide whether this directory will become the Choopan configuration repository.
- Define the initial set of persistent specialist roles after observing recurring work; avoid creating roles speculatively.

## Next actions

1. Install the Herdr skill: `npx skills add herdrdev/herdr --skill herdr -g`.
2. Start Herdr from the intended project directory.
3. Start Claude Code in the controller pane and verify `HERDR_ENV=1`.
4. Ask Choopan to bootstrap the `control` layout.
5. Run a read-only smoke-test worker before enabling concurrent code changes.

## Recent results

- Added the orchestration, context, worker-handoff, state, decision, layout, and safety policies in `CLAUDE.md`.
- Created this compact recovery ledger and `.choopan/DECISIONS.md`.
- Made human-readable decision logging mandatory for every material choice, including its authority, alternatives, consequences, reasoning, assumptions, and evidence.
- Added a persistent functional-role registry that reconciles stable specialist identities with replaceable Herdr panes and native agent sessions.
- Replaced persistent Linux-specific paths with runtime project-root discovery and added macOS/Linux portability and UI fallback rules.

## Blockers

- The Herdr skill is not installed yet.
- No Herdr server or controller session is currently running.
- The configuration has not yet been smoke-tested on macOS.

## Evidence index

- Orchestrator instructions: `CLAUDE.md`
- Durable decision log: `.choopan/DECISIONS.md`
- Persistent role registry: `.choopan/ROLES.md`
- Per-role memory: `.choopan/roles/<role-id>.md`
- Per-task details: `.choopan/tasks/<task-id>.md`
