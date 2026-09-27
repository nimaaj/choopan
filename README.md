# Choopan

Choopan is a Claude Code orchestrator for coding-agent sessions running inside [Herdr](https://herdr.dev/). It coordinates specialized agents, keeps only decision-relevant context in memory, preserves persistent functional roles, and maintains a human-readable record of what was decided and why.

## Design goals

- Control Claude Code, Codex, OpenCode, and other Herdr-recognized agents from one Claude Code session.
- Avoid filling the orchestrator's context with complete worker transcripts.
- Require concise, decision-ready handoffs from every worker.
- Preserve recurring specialist functions across pane, process, and conversation restarts.
- Keep an auditable decision log with alternatives, consequences, reasoning, assumptions, and evidence.
- Run on macOS and Linux without hardcoded host paths or GNU-only shell assumptions.

## How it works

Choopan uses three context tiers:

1. **Live context** contains only the current objective, constraints, pending decisions, and relevant worker handoffs.
2. **Operational state** in `.choopan/STATE.md` provides a compact recovery checkpoint for context compaction or a new controller session.
3. **On-demand evidence** remains in worker panes, task files, diffs, logs, artifacts, and the decision history until it is needed.

Workers return a structured handoff containing their status, summary, choices and consequences, recommendation, reasoning, changes, validation, risks, next step, and artifact paths. Detailed analysis should be written to an artifact rather than copied into the controller's conversation.

Persistent specialists use a stable logical role separate from their current runtime binding:

```text
role definition + compact role memory
                  │
                  ▼
stable Herdr agent name
                  │
                  ▼
replaceable pane + process + native agent session
```

At startup, Choopan reconciles the role registry with live Herdr agents. It prefers an existing named agent, then a Herdr-restored native session, and recreates a missing specialist only when the role's restore policy allows it.

## Requirements

- [Herdr](https://herdr.dev/docs/install/)
- [Claude Code](https://code.claude.com/docs/)
- Node.js and `npx` for installing the Herdr agent skill
- macOS or Linux

Optional terminal tools are detected rather than required:

- File navigation: `yazi`, `ranger`, or `nnn`
- Git interface: `gitui`
- JSON processing: `jq`

Choopan falls back to ordinary shell and Git commands when optional tools are unavailable.

## Setup

Install Herdr's agent skill globally so Claude Code can operate Herdr from any project:

```bash
npx skills add herdrdev/herdr --skill herdr -g
```

Clone and start Choopan inside Herdr:

```bash
git clone https://github.com/nimaaj/choopan.git
cd choopan
herdr
```

In the controller pane, start Claude Code:

```bash
claude
```

Then ask it:

> You are Choopan. Follow `CLAUDE.md`, reconcile `.choopan/STATE.md` and `.choopan/ROLES.md` with the live Herdr session, and bootstrap the control layout without stealing focus. Do not start workers yet.

Claude must run inside a Herdr-managed pane so `HERDR_ENV=1` and the Herdr socket environment are available.

## Suggested interface

Choopan uses Herdr's native sidebar as the cross-agent status display. Its recommended tabs are:

- **control** — Choopan in the large left pane, a terminal file navigator in the upper-right pane, and a shell or Git interface in the lower-right pane.
- **workers** — related implementation and research agents, with no more than four active panes per tab.
- **review** — diffs, tests, and an independent review agent.
- **services** — development servers, test watchers, and logs.

Layouts are created without stealing focus, and existing user panes are preserved.

## Repository structure

```text
CLAUDE.md                         Orchestrator instructions and policies
.choopan/STATE.md                 Compact operational checkpoint
.choopan/DECISIONS.md             Human-readable decision and reasoning log
.choopan/ROLES.md                 Persistent functional-role registry
.choopan/roles/<role-id>.md       Selectively loaded role memory
.choopan/tasks/<task-id>.md       Local, transient task records
```

Host-specific runtime bindings, task evidence, logs, and personal overrides are excluded from Git.

## Decision logging

Every material decision must record:

- Who made it
- The context
- Options considered
- Consequences and tradeoffs
- The chosen action
- Reasoning
- Confidence and assumptions
- Follow-up and supporting evidence

Existing entries are never silently rewritten. Replaced decisions are marked `superseded` or `reversed` and linked to the newer decision.

## Persistent roles

Do not create a persistent role for every worker. Promote a worker only when its function:

- Recurs across tasks
- Benefits from accumulated domain knowledge
- Has clear and distinct ownership
- Needs continuity across Herdr or Claude restarts

The initial registry contains only the `choopan` controller role. Roles such as `architect`, `test_review`, or `release_manager` should be added after real workflows demonstrate the need.

## Current status

The orchestration policies, context model, decision log, persistent-role registry, and portability rules are defined. The remaining operational validation is to run the smoke-test workflow inside Herdr on both Linux and macOS.

## Safety

Choopan does not autonomously approve destructive actions, publish changes, merge branches, expose secrets, or answer consequential worker questions without user authority. It also avoids stopping Herdr servers or deleting named sessions as routine cleanup because those actions can terminate running panes and processes.
