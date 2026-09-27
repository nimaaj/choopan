# Choopan Decision Log

This is the chronological, human-readable record of material decisions made by the user, Choopan, and controlled workers. Each entry explains what was decided, why it was decided, which alternatives were considered, and what consequences follow. Do not paste worker transcripts; cite evidence paths so details can be loaded on demand.

## D001 — Use structured worker handoffs

- Date: 2026-09-27
- Status: accepted
- Decided by: user and Choopan
- Context: Choopan cannot retain complete transcripts from every running agent without crowding out the current objective.
- Options considered: Load all transcripts; keep free-form summaries; require a fixed handoff contract while retaining raw evidence on demand.
- Consequences and tradeoffs: Full transcripts maximize detail but rapidly consume context. Free-form summaries are compact but inconsistent. Fixed handoffs provide predictable decision context but require workers to follow a response schema.
- Decision: Every delegated prompt ends with the structured handoff contract in `CLAUDE.md`.
- Reasoning: Choices, consequences, recommendations, evidence, changes, validation, risks, and next actions are the information the orchestrator needs to make decisions and verify outcomes.
- Confidence and assumptions: High confidence. Assumes controlled agents reliably follow explicit response contracts.
- Follow-up: Adjust the 500-word ceiling after real usage if workers omit important evidence or remain too verbose.
- Evidence: `CLAUDE.md`

## D002 — Use a tiered context model

- Date: 2026-09-27
- Status: accepted
- Decided by: user and Choopan
- Context: Orchestration state must survive compaction and session restarts without loading all agent history.
- Options considered: Depend on live conversation memory; import all state into `CLAUDE.md`; maintain a compact state ledger with selective evidence retrieval.
- Consequences and tradeoffs: Live memory is fragile. Importing all state bloats every turn. Selective retrieval requires disciplined bookkeeping but scales and survives compaction.
- Decision: Use live context, `.choopan/STATE.md`, and on-demand evidence as three separate tiers.
- Reasoning: A fresh Choopan session can resume from a small ledger and fetch only the evidence needed for the current decision.
- Confidence and assumptions: High confidence. Assumes the ledger is updated at meaningful state transitions.
- Follow-up: Keep `STATE.md` under roughly 150 lines and prune completed operational detail.
- Evidence: `CLAUDE.md`, `.choopan/STATE.md`

## D003 — Use Herdr-native UI primitives

- Date: 2026-09-27
- Status: proposed
- Decided by: Choopan; awaiting user validation
- Context: The controller needs file navigation, agent visibility, review, and service output without turning one pane into a crowded dashboard.
- Options considered: Build a custom dashboard; use Herdr tabs, panes, and sidebar with existing terminal tools.
- Consequences and tradeoffs: A custom dashboard could be more tailored but adds maintenance and duplicates Herdr state. Native Herdr primitives are immediately available and composable but may need layout tuning.
- Decision: Use a `control` tab with Choopan, `yazi`, and a shell or `gitui`, plus separate `workers`, `review`, and `services` tabs as needed.
- Reasoning: Herdr already supplies cross-agent status, while the installed terminal tools cover navigation and Git inspection.
- Confidence and assumptions: Medium confidence until the layout is tested at the user's normal terminal size.
- Follow-up: Validate the layout interactively and tune split ratios for the user's terminal dimensions.
- Evidence: `CLAUDE.md`

## D004 — Require a human-readable decision record

- Date: 2026-09-27
- Status: accepted
- Decided by: user
- Context: Structured worker handoffs preserve immediate task context, but they do not by themselves provide a durable narrative of which decisions Choopan ultimately made and why.
- Options considered: Rely on worker handoffs; record only final outcomes; maintain a chronological decision log covering material choices and reasoning.
- Consequences and tradeoffs: Handoffs alone scatter decision history across agents. Outcome-only records omit alternatives and reasoning. A chronological log adds a small bookkeeping cost but makes the system auditable and understandable after compaction or restart.
- Decision: Choopan must record every material user, orchestrator, or worker decision in `.choopan/DECISIONS.md`, including authority, alternatives, consequences, reasoning, assumptions, and evidence.
- Reasoning: A human should be able to understand and audit the course of the work without reconstructing it from terminal transcripts.
- Confidence and assumptions: High confidence. The log remains useful only if routine mechanical steps are excluded and material choices are recorded consistently.
- Follow-up: During the first real orchestration run, review whether the materiality threshold produces too much or too little detail.
- Evidence: User instruction; `CLAUDE.md`

## D005 — Separate persistent roles from runtime sessions

- Date: 2026-09-27
- Status: accepted
- Decided by: user and Choopan
- Context: Some controlled agents should maintain a recurring function across Herdr pane changes, process restarts, Choopan compaction, and native agent-session restoration.
- Options considered: Depend on pane IDs; depend only on native conversation sessions; maintain logical role identities with replaceable runtime bindings and compact role memory.
- Consequences and tradeoffs: Pane IDs are convenient but scoped to a server and may change. Native conversation restore preserves transcript continuity but does not define or audit the agent's function. A role registry adds bookkeeping but preserves purpose, boundaries, ownership, and recovery behavior independently of runtime topology.
- Decision: Use stable Herdr agent names as role IDs, `.choopan/ROLES.md` as the compact binding registry, and `.choopan/roles/<role-id>.md` as selective durable role memory. Reconcile these with live Herdr state at Choopan startup.
- Reasoning: Durable function and durable conversation are related but distinct. Keeping the function outside the agent transcript allows Choopan to restore or replace the runtime without losing role intent.
- Confidence and assumptions: High confidence in the layered design. Assumes Herdr's Claude integration continues reporting native session identity and role files are kept concise.
- Follow-up: Test live reuse, Herdr native restore, ambiguous-match handling, and fresh-process fallback during the first operational run.
- Evidence: User instruction; `CLAUDE.md`; `.choopan/ROLES.md`; `.choopan/roles/choopan.md`; Herdr agent and session-state documentation.

## D006 — Support macOS and Linux with one orchestration protocol

- Date: 2026-09-27
- Status: accepted
- Decided by: user and Choopan
- Context: Choopan and its persistent Herdr roles must be movable between Linux and macOS without embedding one host's paths, package manager, or shell utilities into durable configuration.
- Options considered: Maintain separate platform configurations; standardize on containerized Linux; keep one portable protocol with small runtime-detected adapters and optional-tool fallbacks.
- Consequences and tradeoffs: Separate configurations can optimize each host but will drift. Containerization adds operational complexity and weakens native terminal integration. A shared protocol requires avoiding GNU-only conveniences but keeps role behavior and decision history consistent across hosts.
- Decision: Support Darwin and Linux through runtime platform and capability detection, logical or relative persistent paths, Herdr-provided environment variables, portable shell behavior, and graceful terminal-tool fallbacks.
- Reasoning: Herdr and Claude Code already provide the cross-platform runtime boundary. Choopan should depend on that boundary rather than host-specific filesystem or package-manager conventions.
- Confidence and assumptions: High confidence in the design; medium confidence in execution until a macOS smoke test has validated layout creation, skill discovery, session restoration, and optional-tool fallback behavior.
- Follow-up: Run the same read-only bootstrap test on macOS and Linux, recording versions, selected adapters, and discrepancies.
- Evidence: User instruction; `CLAUDE.md`; `.choopan/ROLES.md`; `.choopan/STATE.md`.
