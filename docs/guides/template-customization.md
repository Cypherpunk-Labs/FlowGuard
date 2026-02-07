# Template Customization Guide

This guide covers how to customize templates in FlowGuard to match your team's conventions and workflows. Templates control the structure and content of specifications, tickets, and agent handoffs.

## Understanding Templates

FlowGuard uses templates to generate structured content for specifications, tickets, and agent handoffs. Templates are text files with placeholders that are replaced with actual values when content is generated.

### Template Types

1. **Specification Templates** - Structure for new specifications
2. **Ticket Templates** - Structure for new tickets
3. **Agent Templates** - Format for agent handoffs
4. **Epic Templates** - Structure for new epics

## Custom Template Directory Setup

To use custom templates, you need to set up a custom template directory:

### Configuration

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "FlowGuard Templates Custom Path"
3. Set the path to your custom template directory
4. Restart VS Code to apply the changes

Example configuration:
```json
{
  "flowguard.templates.customPath": "./flowguard-templates"
}
```

### Directory Structure

Your custom template directory should follow this structure:
```
flowguard-templates/
├── specs/
│   ├── default.md
│   ├── feature.md
│   └── api.md
├── tickets/
│   ├── default.md
│   ├── bug.md
│   └── feature.md
├── handoffs/
│   ├── cursor.md
│   ├── claude.md
│   └── default.md
└── epics/
    └── default.md
```

## Template Variable Syntax

Templates use double curly braces `{{}}` to define placeholders that will be replaced with actual values:

### Basic Syntax

```
{{variable.name}}
```

### Available Variables

#### Specification Variables
- `{{spec.title}}` - Specification title
- `{{spec.author}}` - Specification author
- `{{spec.created}}` - Creation date
- `{{spec.description}}` - Specification description
- `{{spec.tags}}` - Specification tags (comma-separated)

#### Ticket Variables
- `{{ticket.title}}` - Ticket title
- `{{ticket.assignee}}` - Ticket assignee
- `{{ticket.priority}}` - Ticket priority
- `{{ticket.estimate}}` - Time estimate
- `{{ticket.description}}` - Ticket description
- `{{ticket.spec}}` - Associated specification

#### Handoff Variables
- `{{task.title}}` - Task title
- `{{task.description}}` - Task description
- `{{task.acceptanceCriteria}}` - Acceptance criteria as list
- `{{codebase.context}}` - Relevant codebase context
- `{{references.specs}}` - Related specifications
- `{{references.tickets}}` - Related tickets

## Template Substitution

FlowGuard performs variable substitution when generating content from templates:

### Simple Substitution

Template:
```markdown
# {{spec.title}}

Author: {{spec.author}}
Created: {{spec.created}}

## Description
{{spec.description}}
```

Generated Output:
```markdown
# User Authentication API

Author: Jane Developer
Created: 2024-01-15

## Description
Implementation of authentication endpoints for user registration and login.
```

### List Substitution

For variables that contain lists (like tags), FlowGuard can format them appropriately:

Template:
```markdown
Tags: {{spec.tags}}
```

Generated Output:
```markdown
Tags: backend, security, api
```

## Creating Custom Agent Templates

Agent templates are specialized templates for generating handoffs to AI assistants.

### Template Structure

A typical agent template includes:

1. **Task Description** - Clear statement of what needs to be done
2. **Requirements** - Specific requirements and constraints
3. **Acceptance Criteria** - Conditions that must be met
4. **Implementation Plan** - Suggested approach (optional)
5. **Codebase Context** - Relevant files and code snippets
6. **References** - Links to related specifications and tickets

### Example Custom Agent Template

```markdown
# {{task.title}}

## Goal
{{task.description}}

## Requirements
{{#each task.requirements}}
- {{this}}
{{/each}}

## Acceptance Criteria
{{task.acceptanceCriteria}}

## Implementation Plan
1. [ ] Analyze requirements and existing codebase
2. [ ] Design implementation approach
3. [ ] Implement core functionality
4. [ ] Write unit tests
5. [ ] Document changes

## Codebase Context
{{codebase.context}}

## References
{{references.specs}}
{{references.tickets}}

## Notes for AI Assistant
- Focus on clean, maintainable code
- Follow existing code style and patterns
- Include comprehensive error handling
- Write clear, descriptive comments
```

## Spec/Ticket Template Customization

### Specification Template Customization

Create custom specification templates for different types of work:

1. **Feature Specification Template**
```markdown
---
title: {{spec.title}}
status: draft
author: {{spec.author}}
created: {{spec.created}}
tags: [feature]
---

# {{spec.title}}

## Overview
{{spec.description}}

## User Stories
<!-- Add user stories here -->

## Requirements
<!-- Add detailed requirements here -->

## Technical Approach
<!-- Add technical implementation details here -->

## Acceptance Criteria
<!-- Add acceptance criteria here -->
```

2. **API Specification Template**
```markdown
---
title: {{spec.title}}
status: draft
author: {{spec.author}}
created: {{spec.created}}
tags: [api, backend]
---

# {{spec.title}} API

## Overview
{{spec.description}}

## Endpoints
<!-- Add endpoint definitions here -->

## Data Models
<!-- Add data model definitions here -->

## Error Handling
<!-- Add error response specifications here -->

## Security Considerations
<!-- Add security requirements here -->
```

### Ticket Template Customization

Create custom ticket templates for different types of work:

1. **Feature Implementation Ticket**
```markdown
---
title: {{ticket.title}}
status: todo
priority: medium
assignee: {{ticket.assignee}}
estimate: {{ticket.estimate}}
---

# {{ticket.title}}

## Description
{{ticket.description}}

## Implementation Steps
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Dependencies
<!-- List any dependencies here -->
```

2. **Bug Fix Ticket**
```markdown
---
title: {{ticket.title}}
status: todo
priority: {{ticket.priority}}
assignee: {{ticket.assignee}}
estimate: {{ticket.estimate}}
type: bug
---

# {{ticket.title}}

## Bug Description
{{ticket.description}}

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
<!-- Describe what should happen -->

## Actual Behavior
<!-- Describe what actually happens -->

## Environment
<!-- Browser, OS, version, etc. -->

## Fix Approach
<!-- Describe how to fix the bug -->

## Testing
- [ ] Test fix in development
- [ ] Test fix in staging
- [ ] Verify no regressions
```

## Template Validation and Testing

### Validation

FlowGuard validates templates when they are loaded:

1. Checks for proper YAML frontmatter syntax
2. Validates variable placeholder syntax
3. Ensures required fields are present

### Testing Templates

To test your custom templates:

1. Create a new specification or ticket using your template
2. Verify that all placeholders are correctly replaced
3. Check that the generated content matches your expectations
4. Validate that the content works properly in FlowGuard's UI

### Template Debugging

If templates aren't working as expected:

1. Check the Output panel for template validation errors
2. Verify that variable names match available data
3. Ensure proper syntax for placeholders
4. Confirm that the custom template path is correctly configured

## Best Practices

### Template Design

- **Keep templates focused**: Each template should serve a specific purpose
- **Use consistent structure**: Maintain consistent organization across templates
- **Include helpful comments**: Guide users on what to fill in
- **Provide examples**: Show expected content formats

### Variable Usage

- **Use meaningful variable names**: Make it clear what data will be inserted
- **Provide fallbacks**: Handle cases where data might be missing
- **Format appropriately**: Consider how list data and complex objects should be displayed

### Team Collaboration

- **Version control templates**: Store templates in your repository
- **Document template usage**: Explain when to use each template
- **Review template changes**: Ensure team agreement on template modifications

## Example Custom Template Directory

Here's a complete example of a custom template directory:

```
flowguard-templates/
├── specs/
│   ├── default.md
│   ├── feature.md
│   ├── api.md
│   └── technical-design.md
├── tickets/
│   ├── default.md
│   ├── feature.md
│   ├── bug.md
│   └── refactor.md
├── handoffs/
│   ├── cursor.md
│   ├── claude.md
│   ├── default.md
│   └── team-standard.md
└── epics/
    └── default.md
```

## Troubleshooting

### Templates Not Loading

- Verify the custom template path is correct in settings
- Check that template files have the correct `.md` extension
- Ensure template files are properly formatted
- Restart VS Code after changing template settings

### Variables Not Replaced

- Check that variable names match available data exactly
- Verify that placeholders use the correct `{{variable}}` syntax
- Ensure that the data source actually contains the expected variables

### Template Validation Errors

- Check the Output panel for specific error messages
- Verify YAML frontmatter syntax (use a YAML validator)
- Ensure all required fields are present in frontmatter
- Check for unmatched or malformed placeholders

## Next Steps

After customizing templates:

1. [Create specifications](specs-and-tickets.md) using your new templates
2. [Generate tickets](specs-and-tickets.md) with customized structures
3. [Create agent handoffs](handoff-workflow.md) with your team's preferred format

For a guided walkthrough of template customization, see the [Template Customization Tutorial](../tutorials/template-customization-tutorial.md) (coming soon).