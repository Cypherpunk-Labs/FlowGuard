# Command Reference

This reference document provides a comprehensive list of all FlowGuard commands available through the Command Palette. These commands cover all aspects of FlowGuard's functionality.

## Accessing Commands

All FlowGuard commands can be accessed through the VS Code Command Palette:

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "FlowGuard" to filter FlowGuard commands
3. Select the command you want to execute

## Epic Management Commands

### flowguard.initializeEpic
- **Description**: Create a new epic
- **Parameters**: None
- **Usage**: Creates a new epic with user-provided name and description
- **Implementation**: `src/commands/epicCommands.ts`

### flowguard.createPhase
- **Description**: Add a new phase to an existing epic
- **Parameters**: Epic ID
- **Usage**: Adds a phase with user-provided name and description to an epic
- **Implementation**: `src/commands/epicCommands.ts`

### flowguard.addDeliverable
- **Description**: Add a deliverable to an epic
- **Parameters**: Epic ID
- **Usage**: Adds a deliverable with user-provided name and description to an epic
- **Implementation**: `src/commands/epicCommands.ts`

### flowguard.updateEpicStatus
- **Description**: Change the status of an epic
- **Parameters**: Epic ID, new status
- **Usage**: Updates the status of an epic (draft, planning, in_progress, completed)
- **Implementation**: `src/commands/epicCommands.ts`

## Specification & Ticket Management Commands

### flowguard.createSpec
- **Description**: Create a new specification
- **Parameters**: None
- **Usage**: Creates a new specification with user-provided name and optional epic association
- **Implementation**: `src/commands/specCommands.ts`

### flowguard.createTicket
- **Description**: Create a new implementation ticket
- **Parameters**: None
- **Usage**: Creates a new ticket with user-provided name and optional epic/spec association
- **Implementation**: `src/commands/ticketCommands.ts`

### flowguard.generateTicketsFromSpec
- **Description**: Create tickets based on a specification
- **Parameters**: Specification ID
- **Usage**: Analyzes a specification and generates implementation tickets
- **Implementation**: `src/commands/specCommands.ts`

### flowguard.linkSpecToTicket
- **Description**: Create a reference between a spec and ticket
- **Parameters**: Specification ID, Ticket ID
- **Usage**: Links a specification to a ticket for traceability
- **Implementation**: `src/commands/linkCommands.ts`

### flowguard.updateSpecStatus
- **Description**: Change the status of a specification
- **Parameters**: Specification ID, new status
- **Usage**: Updates the status of a specification (draft, review, approved, implemented)
- **Implementation**: `src/commands/specCommands.ts`

### flowguard.updateTicketStatus
- **Description**: Change the status of a ticket
- **Parameters**: Ticket ID, new status
- **Usage**: Updates the status of a ticket (todo, in_progress, in_review, done)
- **Implementation**: `src/commands/ticketCommands.ts`

## Agent Handoff Commands

### flowguard.generateHandoff
- **Description**: Create an agent handoff document
- **Parameters**: Task ID (spec or ticket), agent template
- **Usage**: Generates a structured handoff document for AI assistants
- **Implementation**: `src/commands/handoffCommands.ts`

### flowguard.copyHandoffToClipboard
- **Description**: Copy handoff to clipboard
- **Parameters**: Handoff ID
- **Usage**: Copies the generated handoff content to the system clipboard
- **Implementation**: `src/commands/handoffCommands.ts`

### flowguard.previewHandoff
- **Description**: Preview the handoff document
- **Parameters**: Handoff ID
- **Usage**: Opens a preview of the generated handoff document
- **Implementation**: `src/commands/handoffCommands.ts`

## Verification Commands

### flowguard.verifyChanges
- **Description**: Run verification on current changes
- **Parameters**: Diff source (git, github PR, gitlab MR, or direct input)
- **Usage**: Analyzes code changes for issues, security vulnerabilities, and best practices
- **Implementation**: `src/commands/verificationCommands.ts`

### flowguard.applyAutoFix
- **Description**: Apply suggested fixes
- **Parameters**: Verification issue ID
- **Usage**: Automatically applies a fix for issues that support auto-fixing
- **Implementation**: `src/commands/verificationCommands.ts`

### flowguard.approveVerification
- **Description**: Approve verification results
- **Parameters**: Verification ID
- **Usage**: Marks verification results as approved with optional conditions
- **Implementation**: `src/commands/verificationCommands.ts`

### flowguard.ignoreIssue
- **Description**: Ignore a verification issue
- **Parameters**: Issue ID, reason
- **Usage**: Marks a verification issue as ignored with a provided reason
- **Implementation**: `src/commands/verificationCommands.ts`

## Tutorial & Help Commands

### flowguard.startTutorial
- **Description**: Begin an interactive tutorial
- **Parameters**: Tutorial ID
- **Usage**: Starts the specified interactive tutorial
- **Implementation**: `src/commands/tutorialCommands.ts`

### flowguard.showDocumentation
- **Description**: Open documentation
- **Parameters**: None
- **Usage**: Opens the FlowGuard documentation in a browser
- **Implementation**: `src/commands/helpCommands.ts`

### flowguard.reportIssue
- **Description**: Report a problem
- **Parameters**: None
- **Usage**: Opens the GitHub issues page for FlowGuard
- **Implementation**: `src/commands/helpCommands.ts`

## Configuration Commands

### flowguard.enterApiKey
- **Description**: Securely store an API key
- **Parameters**: Provider name, API key
- **Usage**: Stores an API key in VS Code's SecretStorage
- **Implementation**: `src/commands/configCommands.ts`

### flowguard.migrateConfiguration
- **Description**: Migrate configuration from older versions
- **Parameters**: None
- **Usage**: Updates configuration to the latest format
- **Implementation**: `src/commands/configCommands.ts`

### flowguard.clearCodebaseCache
- **Description**: Clear codebase analysis cache
- **Parameters**: None
- **Usage**: Clears cached codebase analysis results
- **Implementation**: `src/commands/cacheCommands.ts`

## Context-Aware Commands

Some FlowGuard commands are only available in specific contexts:

### When Editing a Specification
- `flowguard.generateTicketsFromSpec` - Available when viewing a spec
- `flowguard.generateHandoff` - Available when viewing a spec

### When Editing a Ticket
- `flowguard.generateHandoff` - Available when viewing a ticket
- `flowguard.linkSpecToTicket` - Available when viewing a ticket

### When Viewing Verification Results
- `flowguard.applyAutoFix` - Available when viewing issues with auto-fixes
- `flowguard.ignoreIssue` - Available when viewing any issue

## Command Implementation References

### Epic Commands
- **File**: `src/commands/epicCommands.ts`
- **Dependencies**: `src/core/storage/EpicMetadataManager.ts`, `src/core/models/Epic.ts`

### Specification Commands
- **File**: `src/commands/specCommands.ts`
- **Dependencies**: `src/core/storage/ArtifactStorage.ts`, `src/core/models/Spec.ts`

### Ticket Commands
- **File**: `src/commands/ticketCommands.ts`
- **Dependencies**: `src/core/storage/ArtifactStorage.ts`, `src/core/models/Ticket.ts`

### Handoff Commands
- **File**: `src/commands/handoffCommands.ts`
- **Dependencies**: `src/handoff/HandoffGenerator.ts`, `src/handoff/TemplateEngine.ts`

### Verification Commands
- **File**: `src/commands/verificationCommands.ts`
- **Dependencies**: `src/verification/VerificationEngine.ts`, `src/verification/SeverityRater.ts`

### Tutorial Commands
- **File**: `src/commands/tutorialCommands.ts`
- **Dependencies**: `src/tutorials/TutorialManager.ts`

### Help Commands
- **File**: `src/commands/helpCommands.ts`
- **Dependencies**: VS Code extension API

### Configuration Commands
- **File**: `src/commands/configCommands.ts`
- **Dependencies**: `src/core/config/SecureStorage.ts`, `src/core/config/migration.ts`

## Example Command Usage

### Creating an Epic
```
Command Palette > FlowGuard: Initialize Epic
Enter epic name: User Authentication System
Enter description: Implement complete user authentication with registration, login, and password management
Select template: default
```

### Generating Tickets from a Specification
```
Command Palette > FlowGuard: Generate Tickets from Spec
Select specification: User Authentication API
Review generated tickets:
- Implement Auth API Endpoints
- Write Unit Tests for Auth API
- Document Auth API Usage
Confirm ticket creation
```

### Running Verification
```
Command Palette > FlowGuard: Verify Changes
Select input source: Current Git diff
Wait for analysis to complete
Review results in Verification view
Apply auto-fixes where available
Approve verification results
```

## Troubleshooting Commands

### Commands Not Appearing

- Ensure FlowGuard is activated in your workspace
- Check that the extension is enabled
- Restart VS Code to refresh command registration
- Check the Output panel for extension activation errors

### Commands Failing

- Check the Output panel under "FlowGuard" for error messages
- Verify that required configuration is complete (API keys, etc.)
- Ensure dependencies are properly installed
- Check that files and directories exist as expected

### Context-Aware Commands Not Available

- Verify that you're in the correct context (editing the right file type)
- Check that the file is properly formatted with required metadata
- Ensure the artifact exists in the FlowGuard system

## Next Steps

For detailed information about specific workflows, see:

- [Creating Epics Guide](../guides/creating-epics.md)
- [Specifications and Tickets Guide](../guides/specs-and-tickets.md)
- [Agent Handoff Workflow Guide](../guides/handoff-workflow.md)
- [Verification Workflow Guide](../guides/verification.md)