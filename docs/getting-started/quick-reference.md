# Quick Reference

This one-page guide provides essential information for using FlowGuard effectively.

## Essential Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+D` | Create new specification |
| `Cmd+Shift+T` | Create new ticket |
| `Cmd+Shift+E` | Initialize new epic |
| `Cmd+Shift+V` | Verify changes |
| `Cmd+Shift+H` | Generate handoff |

*Note: Use `Ctrl` instead of `Cmd` on Windows/Linux*

## Common Commands

### Epic Management
- `FlowGuard: Initialize Epic` - Create a new epic
- `FlowGuard: Create Phase` - Add a phase to an existing epic
- `FlowGuard: Add Deliverable` - Add a deliverable to a phase

### Specification & Ticket Management
- `FlowGuard: Create Specification` - Create a new specification
- `FlowGuard: Create Ticket` - Create a new implementation ticket
- `FlowGuard: Generate Tickets from Spec` - Create tickets based on a specification
- `FlowGuard: Link Spec to Ticket` - Create a reference between a spec and ticket

### Agent Handoffs
- `FlowGuard: Generate Handoff` - Create an agent handoff document
- `FlowGuard: Copy Handoff to Clipboard` - Copy handoff to clipboard
- `FlowGuard: Preview Handoff` - Preview the handoff document

### Verification
- `FlowGuard: Verify Changes` - Run verification on current changes
- `FlowGuard: Apply Auto-fix` - Apply suggested fixes
- `FlowGuard: Approve Verification` - Approve verification results

### Tutorials & Help
- `FlowGuard: Start Tutorial` - Begin an interactive tutorial
- `FlowGuard: Show Documentation` - Open documentation
- `FlowGuard: Report Issue` - Report a problem

## Sidebar Navigation

The FlowGuard sidebar provides access to:

1. **Epics View** - List of all epics in your workspace
2. **Specifications View** - All specifications organized by epic
3. **Tickets View** - Implementation tickets with status tracking
4. **Executions View** - Agent handoffs and execution results
5. **Verification View** - Code analysis and verification results

## File Structure Reference

FlowGuard creates a `.flowguard` directory in your workspace with this structure:

```
.flowguard/
├── epic.json          # Epic metadata
├── specs/             # Specification files (.md with YAML frontmatter)
│   ├── spec-1.md
│   └── spec-2.md
├── tickets/           # Ticket files (.md with YAML frontmatter)
│   ├── ticket-1.md
│   └── ticket-2.md
└── executions/        # Agent handoff executions
    ├── execution-1.md
    └── execution-2.md
```

## Status Workflows

### Specifications
- `draft` → `review` → `approved` → `implemented`

### Tickets
- `todo` → `in_progress` → `in_review` → `done`

### Epics
- `draft` → `planning` → `in_progress` → `completed`

## Reference Resolution

FlowGuard supports cross-referencing between artifacts:

- `spec:name` - Reference a specification
- `ticket:name` - Reference a ticket
- `file:path` - Reference a file in your codebase

Example: "As defined in `spec:user-authentication`, we need to implement `ticket:login-form`."

## Need Help?

- Run the [First Epic Tutorial](../tutorials/first-epic-tutorial.md) to get hands-on experience
- Check the [User Guides](../guides/) for detailed workflows
- Visit the [Troubleshooting Guide](../troubleshooting.md) for common issues
- Refer to the [FAQ](../faq.md) for frequently asked questions