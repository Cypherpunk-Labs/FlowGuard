# Custom Verification Rules

This guide explains how to create custom verification rules for FlowGuard.

## Overview

Verification rules analyze code files and identify potential issues, security vulnerabilities, or deviations from coding standards.

## Rule Interface

All verification rules must implement the VerificationRule interface:

```typescript
interface VerificationRule {
  id: string;
  name: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  enabled: boolean;
  validate(context: ValidationContext): Promise<VerificationIssue[]>;
}
```

## Creating a Custom Rule

### Basic Rule Structure

```typescript
import { VerificationRule, ValidationContext } from 'flowguard/plugins/types';
import { VerificationIssue } from 'flowguard/core/models/Verification';

export class MyCustomRule implements VerificationRule {
  id = 'my-custom-rule';
  name = 'My Custom Rule';
  category = 'security';
  severity = 'High';
  enabled = true;

  async validate(context: ValidationContext): Promise<VerificationIssue[]> {
    // Implementation goes here
    return [];
  }
}
```

## Example Rules

See the security plugin examples in the codebase for complete implementations.

## Best Practices

1. Optimize performance
2. Minimize false positives
3. Provide clear error messages
4. Test thoroughly

## Testing Rules

Create unit tests to verify rule behavior with various code samples.

## Registering Rules

Register rules in your plugin's entry point using `context.registerVerificationRule()`.

## Configuration

Rules can be configured through FlowGuard settings.

## Next Steps

- [Plugin Development Guide](plugin-development.md)
- [LLM Integration Guide](llm-integration.md)
