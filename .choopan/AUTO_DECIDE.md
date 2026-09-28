# Choopan Auto-Decide Policy

## Mode

`off`

Change this to `bounded` only after completing the goals, philosophy, allowed decisions, and escalation rules below. Choopan must treat an incomplete policy as `off`.

## User goals

- Write the outcomes the orchestrator should optimize for.

## Philosophy and principles

- Write the values and decision heuristics Choopan should apply when worker sessions ask for direction.

## Allowed decisions in bounded mode

- List the specific, reversible, in-scope decisions Choopan may make without asking the user.

## Always escalate to the user

- Destructive or irreversible changes.
- Security, access, privacy, credentials, secrets, payments, subscriptions, or external publication.
- Merges, deployments, releases, or changes that alter data or public behavior.
- New dependencies, material scope changes, conflicting goals, low-confidence recommendations, or unclear ownership.
- Native terminal approval dialogs, permission prompts, or any question not covered by the allowed-decision list.

## Decision threshold

- Minimum confidence: `high`
- Maximum impact: `reversible and local`
- Tie-breaker: preserve user control and choose the least irreversible option.

## Response style

- State the selected option, the goal or principle that justified it, the concrete consequences, and the fallback if the assumption is wrong.
