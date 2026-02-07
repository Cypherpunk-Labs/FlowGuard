# Creating Your First Epic

This guide will walk you through creating your first epic in FlowGuard, which is the foundation for organizing your development work.

## What is an Epic?

An epic in FlowGuard represents a large initiative or feature that can be broken down into smaller, manageable specifications and tickets. Epics help you organize complex projects with multiple phases and deliverables.

## Creating Your First Epic

1. **Open the Command Palette**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "FlowGuard: Initialize Epic"

2. **Provide Epic Details**
   - Enter a name for your epic (e.g., "User Authentication System")
   - Add a brief description of what the epic aims to accomplish
   - Select a template if desired (or use the default)

3. **Epic Creation Process**
   - FlowGuard will create a new `.flowguard` directory in your workspace
   - Inside this directory, an `epic.json` file will be generated with metadata
   - The epic structure will be registered in the FlowGuard sidebar

## Understanding the Epic Structure

After creating your epic, you'll notice the following structure in your workspace:

```
.flowguard/
├── epic.json
├── specs/
├── tickets/
└── executions/
```

### epic.json

This file contains metadata about your epic:
- Name and description
- Creation date and author
- Status (draft, planning, in_progress, completed)
- Phases and deliverables

### specs/

This directory will contain all specifications related to your epic. Specifications are detailed technical documents that describe features or components.

### tickets/

This directory will contain implementation tickets generated from your specifications. Tickets represent actionable work items.

### executions/

This directory tracks agent handoffs and execution results.

## Navigating Your Epic

1. **Open the FlowGuard Sidebar**
   - Click on the FlowGuard icon in the Activity Bar
   - You should see your newly created epic listed

2. **Epic View**
   - Click on your epic to view its details
   - See the phases and deliverables you defined
   - Access related specifications and tickets

## Next Steps

After creating your first epic, you can:

1. [Create your first specification](../guides/specs-and-tickets.md)
2. [Generate implementation tickets](../guides/specs-and-tickets.md)
3. [Set up verification workflows](../guides/verification.md)
4. [Configure agent handoffs](../guides/handoff-workflow.md)

For a guided walkthrough, try starting the [First Epic Tutorial](../tutorials/first-epic-tutorial.md) from the Command Palette using "FlowGuard: Start Tutorial".