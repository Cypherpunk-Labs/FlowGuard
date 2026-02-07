# Extending UI Guide

This guide explains how to extend FlowGuard's user interface with custom components.

## Overview

FlowGuard's UI can be extended through custom views, editors, and webview panels.

## Sidebar Views

### Creating Custom Sidebar Views

```typescript
import { SidebarView } from 'flowguard/plugins/types';

const mySidebarView: SidebarView = {
  id: 'my-custom-view',
  name: 'My Custom View',
  icon: 'symbol-method',
  async render(): Promise<string> {
    return `
      <div class="custom-view">
        <h2>My Custom View</h2>
        <p>This is a custom sidebar view</p>
      </div>
    `;
  }
};
```

## Editor Extensions

### Custom Editor Providers

```typescript
import { CustomEditor } from 'flowguard/plugins/types';

const myCustomEditor: CustomEditor = {
  id: 'my-custom-editor',
  name: 'My Custom Editor',
  fileExtensions: ['.custom'],
  async render(content: string): Promise<string> {
    // Render custom editor UI
    return `
      <div class="custom-editor">
        <textarea>${content}</textarea>
      </div>
    `;
  }
};
```

## Webview Panels

### Creating Custom Webview Panels

```typescript
import { WebviewPanel } from 'flowguard/plugins/types';

const myWebviewPanel: WebviewPanel = {
  id: 'my-webview-panel',
  title: 'My Webview Panel',
  async getContent(context: WebviewContext): Promise<string> {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>My Webview</title>
      </head>
      <body>
        <h1>Custom Webview Panel</h1>
        <p>Context: ${JSON.stringify(context)}</p>
      </body>
      </html>
    `;
  }
};
```

## Registering UI Components

Register UI components in your plugin:

```typescript
import { FlowGuardPlugin, PluginContext } from 'flowguard/plugins/types';

export default class MyUIPlugin implements FlowGuardPlugin {
  id = 'my-ui-plugin';
  name = 'My UI Plugin';
  version = '1.0.0';
  description = 'Custom UI components for FlowGuard';

  async activate(context: PluginContext): Promise<void> {
    context.registerSidebarView(mySidebarView);
    context.registerCustomEditor(myCustomEditor);
    context.registerWebviewPanel(myWebviewPanel);
  }

  async deactivate(): Promise<void> {
    // Cleanup if needed
  }
}
```

## Styling

Custom UI components can use VS Code's CSS variables for consistent theming:

```css
.custom-view {
  color: var(--vscode-foreground);
  background-color: var(--vscode-editor-background);
  font-family: var(--vscode-font-family);
}
```

## Best Practices

1. Follow VS Code's UI conventions
2. Use appropriate icons from the VS Code icon set
3. Respect user theme preferences
4. Ensure accessibility compliance
5. Optimize performance for large datasets

## Next Steps

- [Plugin Development Guide](plugin-development.md)
- [Custom Verification Rules Guide](custom-verification-rules.md)
