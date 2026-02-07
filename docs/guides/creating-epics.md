# Creating Epics Guide

This comprehensive guide covers everything you need to know about creating and managing epics in FlowGuard, from initial creation to completion.

## What is an Epic?

An epic in FlowGuard represents a large initiative or feature that can be broken down into smaller, manageable specifications and tickets. Epics help you organize complex projects with multiple phases and deliverables.

## Epic Creation Workflow

### Using the Command Palette

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "FlowGuard: Initialize Epic"
3. Provide the following details when prompted:
   - **Epic Name**: A concise title for your epic
   - **Description**: A brief overview of what the epic aims to accomplish
   - **Template**: Select a template if desired (or use the default)

### Using the Sidebar

1. Click on the FlowGuard sidebar icon
2. Click the "New Epic" button
3. Fill in the epic details in the form that appears
4. Click "Create Epic"

## Epic Metadata Management

Each epic contains metadata stored in the `epic.json` file. This includes:

- **Name**: The title of the epic
- **Description**: A detailed description of the epic's goals
- **Author**: The creator of the epic
- **Creation Date**: When the epic was created
- **Status**: Current status (draft, planning, in_progress, completed)
- **Phases**: Major milestones in the epic's lifecycle
- **Deliverables**: Key outputs or artifacts to be produced

### Editing Epic Metadata

To edit an epic's metadata:

1. Open the FlowGuard sidebar
2. Click on the epic you want to edit
3. Click the "Edit" button in the epic details view
4. Make your changes
5. Click "Save"

## Phase Organization

Phases represent major milestones in your epic's lifecycle. Common phases include:

- **Discovery**: Research and requirements gathering
- **Design**: Architecture and design decisions
- **Implementation**: Coding and development
- **Testing**: Quality assurance and validation
- **Deployment**: Release and rollout

### Adding Phases

1. Open the epic in the sidebar
2. Click "Add Phase"
3. Enter a name and description for the phase
4. Optionally set start and end dates
5. Click "Save"

### Reordering Phases

1. Open the epic in the sidebar
2. Click and drag phases to reorder them
3. The new order will be saved automatically

## Deliverables

Deliverables are the key outputs or artifacts that result from completing an epic. These might include:

- Code implementations
- Documentation
- Test suites
- Deployment configurations

### Adding Deliverables

1. Open the epic in the sidebar
2. Click "Add Deliverable"
3. Enter a name and description for the deliverable
4. Optionally link to related specifications or tickets
5. Click "Save"

## Epic Status Transitions

Epics progress through several statuses during their lifecycle:

### Draft
The initial status when an epic is created. Use this status while defining the epic's scope and requirements.

### Planning
The epic is being planned and organized. Phases and deliverables are being defined.

### In Progress
Work has begun on the epic. Specifications and tickets are being created and implemented.

### Completed
All deliverables have been completed and the epic is finished.

### Transitioning Between Statuses

To change an epic's status:

1. Open the epic in the sidebar
2. Click the current status badge
3. Select the new status from the dropdown
4. Confirm the change

Some transitions may require confirmation or validation.

## Best Practices

### Naming Conventions

- Use clear, descriptive names that convey the epic's purpose
- Keep names concise but informative
- Use consistent naming patterns across your team

### Scope Management

- Define clear boundaries for what is and isn't included in the epic
- Break large epics into smaller, more manageable pieces when possible
- Regularly review and refine epic scope as you learn more

### Documentation

- Keep the epic description up to date as requirements evolve
- Link relevant specifications and tickets to the epic
- Document key decisions and rationale in the epic's description

## Example Epic Structure

Here's an example of how you might structure a user authentication epic:

```json
{
  "name": "User Authentication System",
  "description": "Implement a complete user authentication system with registration, login, and password management",
  "author": "Jane Developer",
  "creationDate": "2024-01-15T10:00:00Z",
  "status": "in_progress",
  "phases": [
    {
      "name": "Discovery",
      "description": "Research authentication requirements and existing solutions",
      "startDate": "2024-01-15",
      "endDate": "2024-01-22"
    },
    {
      "name": "Design",
      "description": "Design authentication architecture and API",
      "startDate": "2024-01-23",
      "endDate": "2024-01-30"
    },
    {
      "name": "Implementation",
      "description": "Implement authentication features",
      "startDate": "2024-01-31",
      "endDate": "2024-02-28"
    }
  ],
  "deliverables": [
    {
      "name": "Authentication API",
      "description": "REST API for user registration, login, and password management"
    },
    {
      "name": "User Documentation",
      "description": "Documentation for end users on how to register and log in"
    }
  ]
}
```

## Troubleshooting

### Epic Not Appearing in Sidebar

- Ensure the `.flowguard` directory exists in your workspace
- Check that the `epic.json` file is properly formatted
- Restart VS Code to refresh the extension

### Unable to Change Status

- Verify that all required fields are filled in
- Check that dependencies (linked specs/tickets) are in appropriate states
- Review any validation messages for specific issues

### Performance Issues with Large Epics

- Consider breaking large epics into smaller, related epics
- Use filtering in the sidebar to focus on specific phases or deliverables
- Archive completed epics that are no longer actively worked on

## Next Steps

After creating and organizing your epic:

1. [Create specifications](specs-and-tickets.md) to detail the implementation approach
2. [Generate tickets](specs-and-tickets.md) for actionable work items
3. [Set up verification workflows](verification.md) to ensure quality
4. [Configure agent handoffs](handoff-workflow.md) for AI-assisted development

For a guided walkthrough, try the [First Epic Tutorial](../tutorials/first-epic-tutorial.md).