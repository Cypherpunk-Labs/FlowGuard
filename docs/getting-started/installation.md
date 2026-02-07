# Installation Guide

Welcome to FlowGuard! This guide will help you install and set up FlowGuard in your VS Code environment.

## Prerequisites

Before installing FlowGuard, ensure you have:

- Visual Studio Code version 1.70.0 or higher
- Node.js version 16.0.0 or higher (for development)
- An LLM provider account (OpenAI, Anthropic, or local LLM) for full functionality

## Installation Methods

### VS Code Marketplace (Recommended)

FlowGuard will be available on the VS Code Marketplace soon. To install:

1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "FlowGuard"
4. Click "Install"

### VSIX Installation

For development or pre-release versions:

1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Extensions: Install from VSIX"
5. Select the downloaded `.vsix` file
6. Restart VS Code when prompted

## Initial Setup

After installation, FlowGuard will automatically activate when you open a workspace. You'll see the FlowGuard sidebar icon appear in the Activity Bar.

### First-time Configuration

1. Click on the FlowGuard sidebar icon
2. The setup wizard will guide you through:
   - Selecting your preferred LLM provider
   - Entering your API key (stored securely in VS Code's SecretStorage)
   - Configuring codebase scanning preferences
   - Setting up template preferences

### Verification

To verify FlowGuard is properly installed:

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "FlowGuard" and you should see several commands available
3. Try running "FlowGuard: Initialize Epic" to create your first epic

## Troubleshooting

If FlowGuard doesn't activate:

- Check that VS Code is up to date
- Verify the extension is enabled in the Extensions view
- Check the Output panel for any error messages from FlowGuard
- Restart VS Code

For more detailed troubleshooting, see our [Troubleshooting Guide](../troubleshooting.md).