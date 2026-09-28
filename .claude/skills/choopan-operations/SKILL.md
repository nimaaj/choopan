---
name: choopan-operations
description: Operate Choopan's bounded auto-decision mode, preserve and resume per-agent session memory, start a remembered session in a new Herdr workspace, or build a read-only overview grid of all live Herdr agents. Use whenever the user asks Choopan to decide for workers automatically, remember or resume a session, start a session in a new workspace, or show all active sessions together.
---

# Choopan operations

Use this skill only inside a Herdr-managed pane. Confirm `HERDR_ENV=1` before any Herdr action. Read only the session memory, role memory, decisions, and worker evidence needed for the current operation.

## Bounded auto-decide mode

Read `.choopan/AUTO_DECIDE.md` before making an automatic decision. Its mode is `off` unless the file says exactly `bounded` and all required policy sections are populated.

When a worker returns `needs-decision`:

1. Identify the exact requested choice and relevant session memory.
2. Check it against the user's goals, philosophy, allowed-decision list, confidence threshold, and maximum impact.
3. Auto-decide only when the choice is explicitly allowed, reversible, local, high confidence, and does not contradict a prior accepted decision.
4. Write a human-readable entry in `.choopan/DECISIONS.md` before or immediately after responding. Include `Decided by: Choopan (bounded auto-decide)`, the policy clauses used, options, consequences, reasoning, assumptions, and fallback.
5. Send the worker a normal follow-up prompt containing the decision, policy basis, constraints, and validation required.

Never auto-answer a native terminal approval dialog with raw keys. Never auto-decide destructive, irreversible, security, privacy, credential, payment, publication, merge, deployment, release, dependency, material-scope, or low-confidence decisions. Escalate those to the user with the choices and recommendation.

While bounded mode governs an active worker, monitor that worker's lifecycle with bounded `herdr agent wait` calls for `idle`, `done`, or `blocked`. On settlement, read its latest structured handoff and either continue its authorized work, record an auto-decision, or escalate. Do not wait indefinitely or run an unattended loop unless the user explicitly asks for continuous monitoring.

## Session memory

Every live controlled agent gets one local memory file at `.choopan/sessions/<session-key>.md` and a local runtime binding at `.choopan/runtime/sessions/<session-key>.json`. These files are intentionally ignored by Git because they can contain local paths and native session references.

At startup, and after agents start, settle, move workspace, or report native session identity, synchronize all named live sessions:

```bash
node scripts/choopan-session-memory.mjs sync
```

Record one session explicitly when adopting an agent or updating a specific target:

```bash
node scripts/choopan-session-memory.mjs record <agent-target> --id <session-key>
```

Use a stable agent name as the session key. For an unnamed agent, ask the user for a stable key rather than using its temporary pane ID.

The generated file is a scaffold. Fill it with the bounded purpose, scope, durable discoveries, latest structured handoff, decision references, artifact paths, and safe resume prompt. Do not paste a raw transcript. Before acting on a remembered session, read only that session's memory and its current Herdr record.

## Resume in a new workspace

When the user says “start `<session-key>` in a new workspace”:

1. Read `.choopan/sessions/<session-key>.md` and `.choopan/runtime/sessions/<session-key>.json`.
2. Run `herdr agent list` and refuse to duplicate the session if its stable name or native session reference is already live. Offer to focus or move the live pane instead.
3. Confirm the desired workspace path or use the remembered preferred path. If the user asks for isolated writes, create a Git worktree first and use its path.
4. Resume with:

```bash
node scripts/choopan-session-memory.mjs start <session-key> --cwd <workspace-path>
```

5. Refresh the session memory, record the new runtime binding, and add a decision-log entry if the new workspace or resume policy materially changes the work.

The helper uses the recorded agent kind and Herdr-reported native session reference. If either is missing or ambiguous, do not guess; ask the user whether to start a fresh session or provide a resume target.

## Read-only overview grid

The overview shows all live Herdr-recognized agents as equal-area observer panes in a dedicated workspace. It does not move target panes, send them input, resize them, or take ownership. Each viewer is backed by Herdr's read-only `terminal session observe` stream.

Create a new overview workspace only on an explicit user request:

```bash
node scripts/choopan-overview.mjs --label choopan-overview
```

The script creates a recursively balanced grid, assigns one observer to each live agent, and labels panes with the agent target and state. It leaves existing overview workspaces unchanged rather than closing or repurposing user panes. Rerun it to create a fresh snapshot grid when the live-agent set changes.

Observer panes are read-only views, not control surfaces. Use the original worker pane or `herdr agent` commands to interact with an agent.
