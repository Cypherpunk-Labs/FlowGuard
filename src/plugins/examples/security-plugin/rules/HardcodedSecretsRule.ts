import { VerificationRule, ValidationContext } from '../../../types';
import { VerificationIssue } from '../../../../core/models/Verification';
import { generateUUID } from '../../../../utils/uuid';

/**
 * Rule to detect hardcoded secrets in code
 */
export class HardcodedSecretsRule implements VerificationRule {
  id = 'hardcoded-secrets';
  name = 'Hardcoded Secrets Detection';
  category = 'security' as const;
  severity = 'Critical' as const;
  enabled = true;

  // Patterns to detect various types of secrets
  private patterns: { name: string; regex: RegExp; suggestion: string }[] = [
    {
      name: 'API Key',
      regex: /api[_-]?key[_-]?[=:]\s*['"]([a-zA-Z0-9]{20,})['"]/i,
      suggestion: 'Use environment variables or a secret management service for API keys'
    },
    {
      name: 'AWS Access Key',
      regex: /AKIA[0-9A-Z]{16}/,
      suggestion: 'Use AWS IAM roles or environment variables for AWS credentials'
    },
    {
      name: 'Private Key',
      regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
      suggestion: 'Store private keys in secure storage, never commit them to version control'
    },
    {
      name: 'Hardcoded Password',
      regex: /password\s*[=:]\s*['"](?!.*\$\{)([^'"]+)['"]/i,
      suggestion: 'Use environment variables or a secret management service for passwords'
    },
    {
      name: 'Auth Token',
      regex: /token[_-]?[=:]\s*['"]([a-zA-Z0-9]{20,})['"]/i,
      suggestion: 'Use environment variables or a secret management service for tokens'
    },
    {
      name: 'Database URL with credentials',
      regex: /(mongodb|mysql|postgresql|postgres|redis):\/\/[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+@/i,
      suggestion: 'Use environment variables for database connection strings with credentials'
    }
  ];

  async validate(context: ValidationContext): Promise<VerificationIssue[]> {
    const issues: VerificationIssue[] = [];
    const content = context.fileContent;

    for (const pattern of this.patterns) {
      const matches = content.match(pattern.regex);
      if (matches) {
        // Find line number
        const lines = content.split('\n');
        let lineNumber = 1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i]?.match(pattern.regex)) {
            lineNumber = i + 1;
            break;
          }
        }

        issues.push({
          id: generateUUID(),
          severity: this.severity,
          category: this.category,
          file: context.filePath,
          line: lineNumber,
          message: `Hardcoded ${pattern.name} detected`,
          suggestion: pattern.suggestion,
          code: matches[0]?.substring(0, 100) // Limit code preview
        });
      }
    }

    return issues;
  }
}
