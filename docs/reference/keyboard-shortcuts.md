# Keyboard Shortcuts Reference

This reference document provides a comprehensive list of all FlowGuard keyboard shortcuts, organized by category. These shortcuts help you work more efficiently with FlowGuard's features.

## Default Shortcuts

FlowGuard comes with a set of default keyboard shortcuts that can be customized according to your preferences.

## Epic Management

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+Shift+E` | Initialize New Epic | Create a new epic |
| `Cmd+Shift+P` | Create Phase | Add a new phase to an epic |
| `Cmd+Shift+D` | Add Deliverable | Add a deliverable to an epic |
| `Cmd+Shift+U` | Update Epic Status | Change the status of an epic |

*Note: Use `Ctrl` instead of `Cmd` on Windows/Linux*

## Specification & Ticket Management

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+Shift+S` | Create Specification | Create a new specification |
| `Cmd+Shift+T` | Create Ticket | Create a new implementation ticket |
| `Cmd+Shift+G` | Generate Tickets from Spec | Create tickets based on a specification |
| `Cmd+Shift+L` | Link Spec to Ticket | Create a reference between a spec and ticket |
| `Cmd+Shift+M` | Update Spec/Ticket Status | Change the status of a spec or ticket |

## Agent Handoffs

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+Shift+H` | Generate Handoff | Create an agent handoff document |
| `Cmd+Shift+C` | Copy Handoff to Clipboard | Copy handoff to clipboard |
| `Cmd+Shift+V` | Preview Handoff | Preview the handoff document |

## Verification

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+Shift+R` | Verify Changes | Run verification on current changes |
| `Cmd+Shift+F` | Apply Auto-fix | Apply suggested fixes |
| `Cmd+Shift+A` | Approve Verification | Approve verification results |

## Navigation

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+Shift+1` | Show Epics View | Switch to the epics view |
| `Cmd+Shift+2` | Show Specifications View | Switch to the specifications view |
| `Cmd+Shift+3` | Show Tickets View | Switch to the tickets view |
| `Cmd+Shift+4` | Show Executions View | Switch to the executions view |
| `Cmd+Shift+5` | Show Verification View | Switch to the verification view |

## Tutorials & Help

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+Shift+/` | Start Tutorial | Begin an interactive tutorial |
| `Cmd+Shift+?` | Show Documentation | Open documentation |
| `Cmd+Shift+!` | Report Issue | Report a problem |

## Platform-Specific Shortcuts

### macOS

- Modifier key: `Cmd`
- Example: `Cmd+Shift+E` for Initialize New Epic

### Windows/Linux

- Modifier key: `Ctrl`
- Example: `Ctrl+Shift+E` for Initialize New Epic

## Customizing Shortcuts

You can customize FlowGuard's keyboard shortcuts through VS Code's keyboard shortcuts editor:

### Using the UI

1. Open VS Code Keyboard Shortcuts (`Cmd+K Cmd+S` or `Ctrl+K Ctrl+S`)
2. Search for "FlowGuard"
3. Click on any shortcut to change it
4. Press your desired key combination
5. Press `Enter` to confirm

### Using keybindings.json

You can also edit shortcuts directly in `keybindings.json`:

```json
[
  {
    "key": "cmd+shift+e",
    "command": "flowguard.initializeEpic",
    "when": "editorTextFocus"
  },
  {
    "key": "cmd+shift+s",
    "command": "flowguard.createSpec",
    "when": "editorTextFocus"
  }
]
```

## Shortcut Categories

### Primary Workflow Shortcuts

These shortcuts cover the most common FlowGuard operations:

- `Cmd+Shift+E` - Initialize New Epic
- `Cmd+Shift+S` - Create Specification
- `Cmd+Shift+T` - Create Ticket
- `Cmd+Shift+H` - Generate Handoff
- `Cmd+Shift+R` - Verify Changes

### View Navigation Shortcuts

Quickly switch between different views in the FlowGuard sidebar:

- `Cmd+Shift+1` - Show Epics View
- `Cmd+Shift+2` - Show Specifications View
- `Cmd+Shift+3` - Show Tickets View
- `Cmd+Shift+4` - Show Executions View
- `Cmd+Shift+5` - Show Verification View

### Action Shortcuts

Perform common actions without navigating through menus:

- `Cmd+Shift+G` - Generate Tickets from Spec
- `Cmd+Shift+C` - Copy Handoff to Clipboard
- `Cmd+Shift+F` - Apply Auto-fix
- `Cmd+Shift+A` - Approve Verification

## Troubleshooting Shortcuts

### Shortcuts Not Working

- Check that FlowGuard is activated in your workspace
- Verify that shortcuts don't conflict with other extensions
- Restart VS Code after changing shortcuts
- Check that the "when" clause conditions are met

### Conflicting Shortcuts

- Open Keyboard Shortcuts UI
- Search for the conflicting shortcut
- Remove or change the conflicting binding
- Test the new shortcut

### Resetting to Defaults

To reset FlowGuard shortcuts to defaults:

1. Open `keybindings.json`
2. Remove all FlowGuard-related entries
3. Restart VS Code
4. Default shortcuts will be restored

## Best Practices

### Learning Shortcuts

- Start with primary workflow shortcuts
- Gradually learn additional shortcuts as needed
- Use the Command Palette as a fallback when you forget shortcuts
- Customize shortcuts to match your workflow preferences

### Customizing for Efficiency

- Place frequently used shortcuts on easily accessible keys
- Group related shortcuts together
- Avoid conflicts with VS Code core shortcuts
- Consider your keyboard layout and typing habits

## Next Steps

For detailed information about FlowGuard features, see:

- [Getting Started Guide](../getting-started/)
- [User Guides](../guides/)
- [Command Reference](commands.md) for all available commands