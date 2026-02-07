# File Formats Reference

This reference document provides detailed information about the file formats used by FlowGuard for storing artifacts, configurations, and metadata. Understanding these formats helps with manual editing, troubleshooting, and integration.

## Specification File Format

Specifications in FlowGuard use Markdown files with YAML frontmatter. This format combines human-readable content with machine-readable metadata.

### Structure

```markdown
---
# YAML frontmatter containing metadata
title: Specification Title
status: draft
author: John Doe
created: 2024-01-15
updated: 2024-01-16
tags: [tag1, tag2]
related:
  - spec:related-spec
  - ticket:related-ticket
---

# Specification Content

Markdown content goes here...
```

### Required Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| title | string | The specification's title |
| status | string | Current status (draft, review, approved, implemented) |
| author | string | Creator of the specification |
| created | string (ISO date) | Creation date |

### Optional Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| updated | string (ISO date) | Last update date |
| tags | array of strings | Keywords for categorization |
| related | array of strings | References to related specs, tickets, or files |
| version | string | Specification version |
| priority | string | Priority level (low, medium, high, critical) |

### Example Specification

```markdown
---
title: User Authentication API
status: approved
author: Jane Developer
created: 2024-01-15
updated: 2024-01-16
tags: [backend, security, api]
related:
  - ticket:implement-auth-api
  - spec:user-registration
version: 1.0
priority: high
---

# User Authentication API

## Overview

This specification defines the REST API endpoints for user authentication.

## Requirements

1. Users must be able to register with email and password
2. Registered users must be able to log in with email and password
3. Users must be able to reset forgotten passwords

## Technical Details

### Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Acceptance Criteria

- [ ] API endpoints return appropriate HTTP status codes
- [ ] Passwords are properly hashed before storage
- [ ] Rate limiting prevents abuse
```

## Ticket File Format

Tickets use the same Markdown with YAML frontmatter format as specifications, but with different metadata fields.

### Structure

```markdown
---
# YAML frontmatter containing ticket metadata
title: Ticket Title
status: todo
assignee: John Doe
priority: medium
estimate: 2 days
created: 2024-01-15
updated: 2024-01-16
spec: related-spec
tags: [tag1, tag2]
---

# Ticket Content

Markdown content goes here...
```

### Required Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| title | string | The ticket's title |
| status | string | Current status (todo, in_progress, in_review, done) |
| created | string (ISO date) | Creation date |

### Optional Frontmatter Fields

| Field | Type | Description |
|-------|------|-------------|
| updated | string (ISO date) | Last update date |
| assignee | string | Person assigned to the ticket |
| priority | string | Priority level (low, medium, high, critical) |
| estimate | string | Time estimate for completion |
| spec | string | Related specification reference |
| tags | array of strings | Keywords for categorization |
| related | array of strings | References to related items |
| type | string | Ticket type (feature, bug, refactor, etc.) |

### Example Ticket

```markdown
---
title: Implement Authentication API Endpoints
status: in_progress
assignee: Jane Developer
priority: high
estimate: 3 days
created: 2024-01-16
updated: 2024-01-17
spec: user-authentication-api
tags: [backend, api, security]
type: feature
---

# Implement Authentication API Endpoints

## Description

Implement the authentication API endpoints as defined in `spec:user-authentication-api`.

## Implementation Steps

- [ ] Create auth controller with endpoint methods
- [ ] Implement user registration logic
- [ ] Implement user login logic
- [ ] Implement password reset functionality

## Acceptance Criteria

- [ ] POST /api/auth/register endpoint created and functional
- [ ] POST /api/auth/login endpoint created and functional
- [ ] Passwords are hashed using bcrypt before storage
- [ ] Unit tests written for all endpoints
```

## Execution File Format

Execution files track agent handoffs and their outcomes.

### Structure

```json
{
  "id": "exec_12345",
  "taskId": "ticket_implement-auth-api",
  "taskType": "ticket",
  "agentTemplate": "cursor",
  "generatedAt": "2024-01-16T14:30:00Z",
  "status": "completed",
  "outputs": [
    {
      "type": "file",
      "path": "src/controllers/auth.controller.ts",
      "status": "created"
    }
  ],
  "notes": "Implementation completed successfully"
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique execution identifier |
| taskId | string | ID of the task that generated this execution |
| taskType | string | Type of task (spec, ticket) |
| agentTemplate | string | Agent template used |
| generatedAt | string (ISO date) | Timestamp when execution was generated |
| status | string | Current status (pending, in_progress, completed, failed) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| outputs | array | Files or artifacts produced |
| notes | string | Additional notes about the execution |
| completedAt | string (ISO date) | Timestamp when execution completed |
| duration | number | Duration in milliseconds |

## Epic Metadata Format

Epic metadata is stored in a JSON file at `.flowguard/epic.json`.

### Structure

```json
{
  "name": "User Authentication System",
  "description": "Implement complete user authentication",
  "author": "Jane Developer",
  "creationDate": "2024-01-15T10:00:00Z",
  "status": "in_progress",
  "phases": [
    {
      "name": "Discovery",
      "description": "Research requirements",
      "startDate": "2024-01-15",
      "endDate": "2024-01-22"
    }
  ],
  "deliverables": [
    {
      "name": "Authentication API",
      "description": "REST API for authentication"
    }
  ]
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| name | string | Epic name |
| description | string | Epic description |
| author | string | Epic creator |
| creationDate | string (ISO date) | When epic was created |
| status | string | Current status |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| phases | array | Epic phases/milestones |
| deliverables | array | Key outputs |
| lastUpdated | string (ISO date) | Last update timestamp |
| version | string | Epic version |

## Frontmatter Validation Rules

FlowGuard validates frontmatter fields to ensure data consistency.

### Specification Validation

```typescript
interface SpecValidationRules {
  title: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200
  },
  status: {
    required: true,
    type: 'string',
    enum: ['draft', 'review', 'approved', 'implemented']
  },
  author: {
    required: true,
    type: 'string',
    minLength: 1
  },
  created: {
    required: true,
    type: 'string',
    format: 'date-time'
  }
}
```

### Ticket Validation

```typescript
interface TicketValidationRules {
  title: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200
  },
  status: {
    required: true,
    type: 'string',
    enum: ['todo', 'in_progress', 'in_review', 'done']
  },
  created: {
    required: true,
    type: 'string',
    format: 'date-time'
  }
}
```

### Reference Validation

References must follow specific formats:

- Specifications: `spec:name` or `spec:path/to/spec`
- Tickets: `ticket:name` or `ticket:path/to/ticket`
- Files: `file:path/to/file` or `file:relative/path`

## File Naming Conventions

### Specifications
- Use kebab-case for filenames
- End with `.md` extension
- Example: `user-authentication-api.md`

### Tickets
- Use kebab-case for filenames
- End with `.md` extension
- Example: `implement-auth-api.md`

### Executions
- Use prefix `exec_` followed by unique ID
- End with `.json` extension
- Example: `exec_12345.json`

## Directory Structure

FlowGuard uses a standardized directory structure:

```
.flowguard/
├── epic.json              # Epic metadata
├── specs/                 # Specification files
│   ├── feature-1.md
│   └── feature-2.md
├── tickets/               # Ticket files
│   ├── ticket-1.md
│   └── ticket-2.md
├── executions/            # Execution records
│   ├── exec_12345.json
│   └── exec_67890.json
└── plugins/               # Plugin data (if any)
```

## Best Practices

### File Organization
- Keep filenames descriptive but concise
- Use consistent naming conventions
- Organize files in logical directory structures
- Use version control for tracking changes

### Metadata Management
- Keep metadata up to date
- Use meaningful tags for categorization
- Maintain accurate relationships between artifacts
- Regularly review and clean up stale references

### Manual Editing
- Use a YAML validator for frontmatter
- Validate dates in ISO format
- Check reference syntax
- Test changes in FlowGuard after manual edits

## Troubleshooting

### Common Issues

1. **Invalid YAML Frontmatter**
   - Check for proper indentation
   - Ensure proper quoting of strings
   - Validate with a YAML parser

2. **Missing Required Fields**
   - Verify all required fields are present
   - Check field names for typos
   - Ensure proper data types

3. **Invalid Date Formats**
   - Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)
   - Ensure timezone information is included for timestamps

4. **Broken References**
   - Verify referenced items exist
   - Check reference syntax (`spec:name`, not `Spec:Name`)
   - Ensure no typos in reference names

### Validation Tools

FlowGuard provides built-in validation, but you can also use external tools:

- YAML validators for frontmatter
- JSON validators for execution files
- Markdown linters for content

## Next Steps

For detailed information about working with these file formats, see:

- [Specifications and Tickets Guide](../guides/specs-and-tickets.md)
- [Agent Handoff Workflow Guide](../guides/handoff-workflow.md)
- [Template Customization Guide](../guides/template-customization.md)