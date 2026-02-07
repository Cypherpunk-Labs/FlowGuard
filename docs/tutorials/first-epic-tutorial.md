# First Epic Tutorial

This tutorial guides you through creating your first epic in FlowGuard, which is the foundational unit for organizing your development work.

## What You'll Learn

- How to initialize a new epic
- Creating specifications within your epic
- Editing specification metadata
- Generating implementation tickets from specifications
- Creating agent handoffs for AI-assisted development

## Prerequisites

- FlowGuard extension installed and activated
- A workspace folder open in VS Code
- Basic understanding of software development concepts

## Steps

### 1. Initialize Your First Epic

An epic is a container for related specifications and tickets. To create your first epic:

1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "FlowGuard: Initialize Epic" and select the command
3. Enter a name for your epic (e.g., "User Authentication")
4. Provide a brief description
5. Confirm creation

### 2. Create a Specification

Specifications define features, components, or requirements within your epic:

1. Open the command palette
2. Run "FlowGuard: Create Specification"
3. Select your epic from the list
4. Enter a title for your specification (e.g., "Login Page")
5. Provide a detailed description
6. Confirm creation

### 3. Edit Specification Metadata

Specification metadata helps categorize and track your work:

1. Open the specification file in the editor
2. Edit the YAML frontmatter at the top of the file
3. Add relevant tags to categorize your specification
4. Update the status field as you progress
5. Save your changes

### 4. Create a Ticket from Specification

Tickets are actionable items generated from specifications:

1. With your specification open, use the command palette
2. Run "FlowGuard: Generate Tickets from Spec"
3. Review the generated tickets
4. Confirm creation of the tickets you want to implement

### 5. Generate Agent Handoff

Agent handoffs provide AI assistants with all necessary context:

1. Open your ticket in the editor
2. Use the command palette to run "FlowGuard: Generate Handoff"
3. Select an agent template appropriate for your task
4. Review the generated handoff document
5. Copy it to your clipboard or save it for use with your AI assistant

## Next Steps

After completing this tutorial, you might want to explore:

- The Verification Tutorial to learn how to verify your code changes
- The Handoff Tutorial to dive deeper into AI-assisted development workflows
- Reading more about epics and specifications in the [Creating Epics](../guides/creating-epics.md) guide

## Troubleshooting

If you encounter issues:

- Ensure FlowGuard is properly installed and activated
- Check that you have write permissions in your workspace
- Verify your FlowGuard configuration in VS Code settings
- Consult the [Troubleshooting](../troubleshooting.md) guide for common issues