# Specifications and Tickets Guide

This guide covers the lifecycle of specifications and tickets in FlowGuard, from creation to completion. Specifications define what should be built, while tickets represent the actionable work to implement those specifications.

## Understanding Specifications

Specifications (specs) in FlowGuard are detailed technical documents that describe features, components, or requirements. They use YAML frontmatter for metadata and Markdown for content.

### Spec Structure

A typical spec includes:

- **Metadata** in YAML frontmatter (title, status, tags, author, etc.)
- **Overview** describing the feature or component
- **Requirements** detailing what needs to be implemented
- **Technical Details** with implementation guidance
- **Acceptance Criteria** defining success conditions

### Creating Specifications

1. **Using the Command Palette**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "FlowGuard: Create Specification"
   - Enter a name for your spec
   - Select an epic to associate with (optional)
   - Choose a template if desired

2. **Using the Sidebar**:
   - Click on the FlowGuard sidebar icon
   - Navigate to the Specifications view
   - Click "New Specification"
   - Fill in the details in the form

### Spec Editor Features

The FlowGuard spec editor provides several features to enhance your writing experience:

- **Frontmatter Editor**: Visual editor for spec metadata
- **Markdown Preview**: Real-time preview of rendered content
- **Reference Resolution**: Clickable links for `spec:`, `ticket:`, and `file:` references
- **Template Integration**: Pre-populated templates for common spec types
- **Auto-save**: Automatic saving of changes (configurable)

## Spec Metadata

Specifications use YAML frontmatter to store metadata:

```yaml
title: User Authentication API
status: draft
tags: [backend, security, api]
author: Jane Developer
created: 2024-01-15
updated: 2024-01-16
related:
  - spec:user-registration
  - ticket:implement-auth-api
```

### Key Metadata Fields

- **title**: The spec's title
- **status**: Current status (draft, review, approved, implemented)
- **tags**: Keywords for categorization
- **author**: Creator of the spec
- **created/updated**: Timestamps
- **related**: References to related specs, tickets, or files

## Ticket Generation

Tickets represent actionable work items derived from specifications. FlowGuard can automatically generate tickets from specs.

### Generating Tickets from Specs

1. Open a specification in the editor
2. Click the "Generate Tickets" button in the toolbar
3. Review the suggested tickets in the preview
4. Click "Create Tickets" to generate them

### Manual Ticket Creation

1. **Using the Command Palette**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "FlowGuard: Create Ticket"
   - Enter a name for your ticket
   - Select an epic and spec to associate with (optional)

2. **Using the Sidebar**:
   - Click on the FlowGuard sidebar icon
   - Navigate to the Tickets view
   - Click "New Ticket"
   - Fill in the details in the form

## Ticket Breakdown and Acceptance Criteria

Effective tickets include:

- **Clear Description**: What needs to be done
- **Acceptance Criteria**: Specific conditions that must be met
- **Estimates**: Time or complexity estimates (optional)
- **Assignees**: Team members responsible (optional)
- **Priority**: Importance relative to other tickets

### Writing Good Acceptance Criteria

- Be specific and measurable
- Focus on outcomes, not implementation details
- Include both positive and negative test cases
- Make criteria independently verifiable

Example:
```markdown
## Acceptance Criteria

- [ ] User can register with email and password
- [ ] Password must be at least 8 characters
- [ ] Email validation prevents duplicate accounts
- [ ] Registration fails with appropriate error messages for invalid input
```

## Status Workflows

### Specification Statuses

1. **Draft**: Initial creation, work in progress
2. **Review**: Ready for team review and feedback
3. **Approved**: Accepted and ready for implementation
4. **Implemented**: Work has been completed per the spec

### Ticket Statuses

1. **To Do**: Not yet started
2. **In Progress**: Actively being worked on
3. **In Review**: Completed and under review
4. **Done**: Accepted and complete

### Status Transitions

Status transitions are managed through the UI:

1. Open the spec or ticket in the sidebar or editor
2. Click the status badge
3. Select the new status from the dropdown
4. Confirm any required information

Some transitions may require validation or confirmation.

## Reference Resolution

FlowGuard supports cross-referencing between artifacts using a simple syntax:

- `spec:name` - Reference a specification
- `ticket:name` - Reference a ticket
- `file:path` - Reference a file in your codebase

These references become clickable links in the editor and sidebar, making it easy to navigate between related items.

Example:
```markdown
This implementation follows the approach defined in `spec:user-authentication` and will fulfill `ticket:login-form`.
```

## Best Practices

### Specification Best Practices

- **Keep specs focused**: Each spec should cover a single, well-defined feature or component
- **Use templates**: Consistent structure makes specs easier to write and review
- **Link related items**: References help build a web of connected knowledge
- **Update regularly**: Keep specs current as requirements evolve

### Ticket Best Practices

- **Small and focused**: Each ticket should represent a single, completable unit of work
- **Clear acceptance criteria**: Know exactly what "done" looks like
- **Estimate realistically**: Consider complexity, unknowns, and dependencies
- **Link to specs**: Ensure implementation aligns with requirements

## Example Specification

```yaml
---
title: User Authentication API
status: approved
tags: [backend, security, api]
author: Jane Developer
created: 2024-01-15
updated: 2024-01-16
related:
  - ticket:implement-auth-api
  - spec:user-registration
---

# User Authentication API

## Overview

This specification defines the REST API endpoints for user authentication, including registration, login, and password management.

## Requirements

1. Users must be able to register with email and password
2. Registered users must be able to log in with email and password
3. Users must be able to reset forgotten passwords
4. All endpoints must enforce rate limiting to prevent abuse
5. All communication must be encrypted (HTTPS only)

## Technical Details

### Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset completion

### Authentication

Use JWT tokens for authentication. Tokens should expire after 24 hours.

## Acceptance Criteria

- [ ] API endpoints return appropriate HTTP status codes
- [ ] Passwords are properly hashed before storage
- [ ] Rate limiting prevents more than 10 requests per minute per IP
- [ ] All endpoints require HTTPS
- [ ] JWT tokens are properly validated on protected endpoints
```

## Example Ticket

```yaml
---
title: Implement Authentication API Endpoints
status: in_progress
priority: high
assignee: Jane Developer
estimate: 3 days
spec: user-authentication-api
tags: [backend, api, security]
created: 2024-01-16
updated: 2024-01-17
---

# Implement Authentication API Endpoints

## Description

Implement the authentication API endpoints as defined in `spec:user-authentication-api`.

## Acceptance Criteria

- [ ] `POST /api/auth/register` endpoint created and functional
- [ ] `POST /api/auth/login` endpoint created and functional
- [ ] `POST /api/auth/forgot-password` endpoint created and functional
- [ ] `POST /api/auth/reset-password` endpoint created and functional
- [ ] Passwords are hashed using bcrypt before storage
- [ ] JWT tokens are generated on successful login
- [ ] Rate limiting implemented (10 requests/minute/IP)
- [ ] All endpoints enforce HTTPS
- [ ] Unit tests written for all endpoints
- [ ] Integration tests written for authentication flow

## Implementation Notes

- Use the existing database models for User
- Follow the error response format established in other APIs
- Ensure proper logging for security events
```

## Troubleshooting

### Specs Not Appearing in Sidebar

- Ensure the `.flowguard/specs/` directory exists
- Check that spec files have the `.md` extension
- Verify that frontmatter is properly formatted
- Restart VS Code to refresh the extension

### Reference Links Not Working

- Verify that referenced items exist and are properly named
- Check that reference syntax is correct (`spec:name`, not `Spec:Name`)
- Ensure there are no typos in reference names

### Editor Performance Issues

- Large specs may take longer to load; consider breaking into smaller specs
- Disable preview mode for very large specs if performance is an issue
- Check VS Code's performance tips for large files

## Next Steps

After creating specs and tickets:

1. [Generate agent handoffs](handoff-workflow.md) to implement the work
2. [Set up verification workflows](verification.md) to ensure quality
3. [Track progress](../reference/commands.md) through the implementation phase

For a guided walkthrough, try the specifications portion of the [First Epic Tutorial](../tutorials/first-epic-tutorial.md).