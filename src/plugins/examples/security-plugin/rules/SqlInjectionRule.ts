import { VerificationRule, ValidationContext } from '../../../types';
import { VerificationIssue } from '../../../../core/models/Verification';
import { generateUUID } from '../../../../utils/uuid';

/**
 * Rule to detect potential SQL injection vulnerabilities
 */
export class SqlInjectionRule implements VerificationRule {
  id = 'sql-injection';
  name = 'SQL Injection Detection';
  category = 'security' as const;
  severity = 'High' as const;
  enabled = true;

  // Patterns to detect potential SQL injection
  private patterns: { name: string; regex: RegExp; suggestion: string }[] = [
    {
      name: 'String concatenation in SQL query',
      regex: /(execute|query|exec)\s*\(\s*["'].*\+.*\$/i,
      suggestion: 'Use parameterized queries or prepared statements to prevent SQL injection'
    },
    {
      name: 'Template literal in SQL query',
      regex: /(execute|query|exec)\s*\(\s*[`"'].*\$\{/i,
      suggestion: 'Use parameterized queries or prepared statements to prevent SQL injection'
    },
    {
      name: 'Direct SQL concatenation',
      regex: /SELECT.*\+.*FROM|INSERT.*\+.*INTO|UPDATE.*\+.*SET/i,
      suggestion: 'Use parameterized queries or prepared statements to prevent SQL injection'
    },
    {
      name: 'Raw SQL with string interpolation',
      regex: /sql\s*[=:]\s*[`"'].*\$\{/i,
      suggestion: 'Use parameterized queries or prepared statements to prevent SQL injection'
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
          message: `Potential ${pattern.name}`,
          suggestion: pattern.suggestion,
          code: matches[0]?.substring(0, 100) // Limit code preview
        });
      }
    }

    return issues;
  }
}
