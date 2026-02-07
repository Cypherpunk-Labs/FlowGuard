# Agent Handoff Workflow Guide

This guide covers how to generate, customize, and manage agent handoffs in FlowGuard. Agent handoffs are structured documents that provide AI assistants with all the context they need to implement specifications or tickets.

## What is an Agent Handoff?

An agent handoff is a structured document that contains all the information an AI assistant needs to complete a task. This includes:

- Task description and requirements
- Relevant specifications and tickets
- Codebase context and references
- Implementation constraints and guidelines
- Expected outputs and acceptance criteria

## Generating Handoffs

### Using the Command Palette

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "FlowGuard: Generate Handoff"
3. Select the specification or ticket to generate a handoff for
4. Choose an agent template (Cursor, Claude, Windsurf, Cline, Aider)
5. Review and customize the generated handoff if needed

### Using the Sidebar

1. Click on the FlowGuard sidebar icon
2. Navigate to the specification or ticket you want to create a handoff for
3. Click the "Generate Handoff" button
4. Select an agent template
5. Review the generated handoff

## Agent Templates

FlowGuard supports several agent templates, each optimized for a specific AI assistant:

### Cursor Template
Optimized for Cursor IDE integration with file modification instructions.

### Claude Template
Structured for Anthropic's Claude with clear sections and reasoning steps.

### Windsurf Template
Designed for Windsurf's workflow with code block annotations.

### Cline Template
Formatted for Cline's conversational approach with step-by-step instructions.

### Aider Template
Tailored for Aider's command-line interface with specific formatting.

### Selecting a Template

When generating a handoff, you can:

1. Use the default template configured in settings
2. Select a different template from the available options
3. Create and use custom templates (see [Custom Agents Guide](../advanced/custom-agents.md))

## Template Customization

Handoffs can be customized using the template engine:

### Template Variables

Templates use variables that are replaced with actual values:

- `{{task.title}}` - Title of the specification or ticket
- `{{task.description}}` - Description content
- `{{task.acceptanceCriteria}}` - Acceptance criteria as a list
- `{{codebase.context}}` - Relevant codebase context
- `{{references.specs}}` - Related specifications
- `{{references.tickets}}` - Related tickets

### Customizing Templates

To customize templates:

1. Set a custom template directory in settings (`flowguard.templates.customPath`)
2. Create template files following the expected structure
3. Reference your custom templates in the configuration

## Preview Mode

Before copying a handoff to clipboard or saving it, you can preview it:

1. After generating a handoff, click "Preview"
2. Review the formatted output in the preview panel
3. Make adjustments to the source specification or ticket if needed
4. Regenerate the handoff to see updated results

## Clipboard Copy

To copy a handoff to clipboard:

1. Generate or open an existing handoff
2. Click the "Copy to Clipboard" button
3. Paste into your AI assistant's interface

The handoff will be copied in a format optimized for the selected agent template.

## Execution Tracking

FlowGuard tracks handoff executions to help you monitor progress:

### Execution Records

Each time you generate a handoff, an execution record is created in `.flowguard/executions/`:

```json
{
  "id": "exec_12345",
  "taskId": "ticket_implement-auth-api",
  "taskType": "ticket",
  "agentTemplate": "cursor",
  "generatedAt": "2024-01-16T14:30:00Z",
  "status": "pending",
  "outputs": []
}
```

### Execution Statuses

- **Pending**: Handoff generated but not yet executed
- **In Progress**: Agent is working on the task
- **Completed**: Task completed successfully
- **Failed**: Task failed or was abandoned

### Updating Execution Status

1. Open the FlowGuard sidebar
2. Navigate to the Executions view
3. Find the execution record
4. Click the status badge to change it
5. Add notes about the execution outcome

## Example Handoff (Cursor Template)

```markdown
# Task: Implement Authentication API Endpoints

## Description
Implement the authentication API endpoints as defined in spec:user-authentication-api.

## Requirements
- Create POST /api/auth/register endpoint
- Create POST /api/auth/login endpoint
- Create POST /api/auth/forgot-password endpoint
- Create POST /api/auth/reset-password endpoint
- Hash passwords using bcrypt
- Generate JWT tokens on successful login
- Implement rate limiting (10 requests/minute/IP)
- Enforce HTTPS on all endpoints

## Acceptance Criteria
- [ ] POST /api/auth/register endpoint created and functional
- [ ] POST /api/auth/login endpoint created and functional
- [ ] POST /api/auth/forgot-password endpoint created and functional
- [ ] POST /api/auth/reset-password endpoint created and functional
- [ ] Passwords are hashed using bcrypt before storage
- [ ] JWT tokens are generated on successful login
- [ ] Rate limiting implemented (10 requests/minute/IP)
- [ ] All endpoints enforce HTTPS
- [ ] Unit tests written for all endpoints
- [ ] Integration tests written for authentication flow

## Implementation Plan
1. Create auth controller with endpoint methods
2. Implement user registration logic
3. Implement user login logic
4. Implement password reset functionality
5. Add bcrypt hashing for passwords
6. Implement JWT token generation
7. Add rate limiting middleware
8. Ensure HTTPS enforcement
9. Write unit tests
10. Write integration tests

## Codebase Context
Relevant files:
- src/controllers/auth.controller.ts (create this file)
- src/models/user.model.ts (existing user model)
- src/middleware/rate-limit.middleware.ts (existing rate limiter)
- src/utils/jwt.util.ts (existing JWT utilities)

## References
- spec:user-authentication-api
- ticket:implement-auth-api
```

## Best Practices

### Writing Effective Handoffs

- **Be specific**: Clear requirements reduce ambiguity
- **Include context**: Help agents understand the bigger picture
- **Define success**: Clear acceptance criteria make validation easier
- **Provide examples**: Sample code or output formats when helpful

### Template Selection

- **Match your workflow**: Use the template that best fits your AI assistant
- **Team consistency**: Standardize on templates across your team
- **Experiment**: Try different templates to see which works best for your tasks

### Execution Tracking

- **Update status regularly**: Keep execution records current
- **Add notes**: Document what worked and what didn't
- **Link outputs**: Connect execution results to specifications and tickets

## Troubleshooting

### Handoff Generation Fails

- Ensure the specification or ticket has sufficient content
- Check that referenced items exist and are properly named
- Verify that the selected template is valid

### Agent Doesn't Understand Handoff

- Review the handoff content for clarity
- Try a different agent template
- Add more context or examples to the specification

### Execution Tracking Issues

- Ensure the `.flowguard/executions/` directory exists
- Check that execution files are properly formatted JSON
- Restart VS Code to refresh the extension

## Next Steps

After generating and executing handoffs:

1. [Run verification](verification.md) on the generated code
2. [Update specifications and tickets](specs-and-tickets.md) with implementation details
3. [Create new specifications](specs-and-tickets.md) for any discovered requirements

For a guided walkthrough, try the [Handoff Tutorial](../tutorials/handoff-tutorial.md).