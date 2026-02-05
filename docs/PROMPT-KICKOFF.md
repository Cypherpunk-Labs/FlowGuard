Build a complete open-source VS Code extension called **FlowGuard** — the ultimate planning, orchestration, and verification layer for AI-first development teams.

Core mission: Completely eliminate intent drift by turning any natural-language goal into a living, git-trackable specification before a single line of code is written, handing it off cleanly to any external coding agent, and then automatically verifying every change against the original intent.

Exact user experience:

1. User enters a high-level goal or pastes an existing PRD/artifact.
2. FlowGuard explores the open codebase, asks at most 2–3 clarifying questions if needed, then instantly generates:
   - Epic overview
   - Optional phased breakdown (for large projects)
   - Full Technical Plan including file-by-file changes, Mermaid architecture/sequence/flow diagrams, edge cases, non-functional requirements
   - Editable Artifacts (PRD + tech spec)

3. One-click Handoff button that copies a perfectly formatted, self-contained prompt + all relevant context. User pastes it directly into Cursor, Claude Projects, Windsurf, Cline, Aider, or any other agent.

4. After the agent returns changes (diff/PR), user clicks Verify. FlowGuard scans the diff against the original spec, produces severity-rated comments (Critical / High / Medium / Low), suggests fixes or rollbacks, and offers one-click apply where safe.

5. All artifacts are stored in a .FlowGuard/ folder in the repo (fully git-trackable, human-readable Markdown + JSON).

Required capabilities:
- 100% agent-agnostic handoff with customizable prompt templates per agent
- Multi-agent planning support
- Full Epic Mode for massive refactors
- Clean modern sidebar UI built with TypeScript + VS Code Extension API
- Built-in prompt template editor so users can tweak Epic/Phase/Verification generation style
- MIT license, modular design, easy to extend with plugins later

Output the full end-to-end spec for this extension exactly as you normally do: Epic → Phases → Technical Plan → all Mermaid diagrams → ready-to-paste handoff prompt so I can start building it immediately.