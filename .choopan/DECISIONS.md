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

## D007 — Bound automatic decisions to explicit user policy

- Date: 2026-09-27
- Status: accepted
- Decided by: user and Choopan
- Context: The orchestrator must be able to answer routine worker questions without carrying every decision back to the user, while preserving user authority over consequential work.
- Options considered: Keep all decisions manual; allow unrestricted autonomous decisions; enable only a user-authored bounded mode with a defined escalation boundary.
- Consequences and tradeoffs: Manual-only coordination is safe but slow. Unrestricted autonomy can silently exceed user intent. Bounded mode adds a policy-maintenance step but gives the orchestrator fast, auditable authority over explicitly allowed, reversible local choices.
- Decision: Auto-decide mode remains off until `.choopan/AUTO_DECIDE.md` explicitly enables `bounded` mode with goals, philosophy, allowed decisions, and escalation rules. Each automatic decision is logged with its policy basis and reasoning.
- Reasoning: The user should control both the philosophy and the scope of delegation; Choopan should make only the decisions that are clearly delegated.
- Confidence and assumptions: High confidence. The policy must remain specific enough to distinguish a routine choice from a material change.
- Follow-up: Populate the policy from the user's goals before enabling it; test one low-impact auto-decision and review the log quality.
- Evidence: User instruction; `.choopan/AUTO_DECIDE.md`; `.claude/skills/choopan-operations/SKILL.md`.

## D008 — Preserve session memory separately from persistent roles

- Date: 2026-09-27
- Status: accepted
- Decided by: user and Choopan
- Context: Every running agent session needs recallable context and a safe way to resume it in a new workspace, including one-off sessions that should not become permanent roles.
- Options considered: Keep only role memory; rely only on the native agent transcript; create a local memory and runtime-binding pair for every controlled live session.
- Consequences and tradeoffs: Role memory omits one-off agents. Native transcript continuity alone loses the operational purpose, artifacts, and safe resume guidance. Per-session memory adds local files but retains concise intent and recovery data without promoting every session to a role.
- Decision: Create local, Git-ignored `.choopan/sessions/<key>.md` memory and `.choopan/runtime/sessions/<key>.json` bindings for each controlled session. Use them to prevent duplicate resumes and to start remembered sessions in a new Herdr workspace.
- Reasoning: Functional persistence and session persistence are distinct. The role registry describes recurring responsibilities; session memory describes a particular conversation and its next safe action.
- Confidence and assumptions: High confidence. Assumes Choopan records sessions after creation and meaningful state changes.
- Follow-up: Validate a Claude Code session record and new-workspace resume flow during the first live smoke test.
- Evidence: User instruction; `scripts/choopan-session-memory.mjs`; `.choopan/SESSION_MEMORY_TEMPLATE.md`.

## D009 — Use read-only terminal observers for the overview grid

- Date: 2026-09-27
- Status: accepted
- Decided by: user and Choopan
- Context: The user wants every current controlled session visible in one equal-area overview workspace without disrupting the original agent panes.
- Options considered: Move live panes into an overview workspace; duplicate agent processes; create a grid of read-only terminal observers.
- Consequences and tradeoffs: Moving panes changes users' working layout. Duplicating agents risks duplicate work and session conflicts. Observer panes add a display process but preserve original terminal ownership and support multiple concurrent views.
- Decision: Build a dedicated overview workspace of balanced read-only observer panes, one per live Herdr-recognized agent, using `terminal session observe`.
- Reasoning: Herdr's observer stream is designed for third-party rendered-terminal views and does not take input, resize, scroll, or takeover ownership.
- Confidence and assumptions: Medium confidence until tested against live agent terminals; Herdr documents observer support on macOS and Linux.
- Follow-up: Run the overview script with multiple agents and inspect frame rendering, grid geometry, and refresh behavior.
- Evidence: User instruction; `scripts/choopan-overview.mjs`; `scripts/choopan-observe.mjs`; Herdr CLI documentation.
