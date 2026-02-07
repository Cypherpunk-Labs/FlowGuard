# Verification Workflow Guide

This guide covers how to use FlowGuard's verification system to analyze and validate code changes. Verification helps ensure code quality, security, and adherence to specifications.

## What is Verification?

Verification in FlowGuard is the process of analyzing code changes to identify potential issues, security vulnerabilities, and deviations from best practices. It can work with various input formats including Git diffs, GitHub PRs, and GitLab MRs.

## Running Verification

### Using the Command Palette

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "FlowGuard: Verify Changes"
3. Select the verification input source:
   - Current Git diff
   - GitHub Pull Request URL
   - GitLab Merge Request URL
   - Paste diff content directly

### Using the Sidebar

1. Click on the FlowGuard sidebar icon
2. Navigate to the Verification view
3. Click "Run Verification"
4. Select the input source and provide necessary details

### Automated Verification

Verification can be configured to run automatically:

1. On Git commit (pre-commit hook)
2. On file save (for configured file types)
3. On PR creation (via CI/CD integration)

## Diff Input Formats

FlowGuard supports multiple diff input formats:

### Git Diff

Local changes in your workspace that haven't been committed yet.

### GitHub Pull Request

Provide a URL to a GitHub PR to analyze all changes in that PR.

### GitLab Merge Request

Provide a URL to a GitLab MR to analyze all changes in that merge request.

### Direct Diff Input

Paste diff content directly into the verification interface for analysis.

## Understanding Verification Results

Verification results are displayed in the Verification view with the following information:

### Issue Details

Each identified issue includes:

- **Description**: Explanation of the problem
- **Severity**: Critical, High, Medium, or Low
- **File and Line**: Location of the issue
- **Category**: Type of issue (security, performance, style, etc.)
- **Recommendation**: How to fix the issue
- **References**: Links to relevant documentation or standards

### Severity Levels

- **Critical**: Must be fixed before merging; potential security vulnerability or major issue
- **High**: Should be fixed soon; significant problem affecting functionality or maintainability
- **Medium**: Consider fixing; minor issue that could be improved
- **Low**: Optional fix; stylistic or minor improvement suggestion

## Applying Auto-fixes

FlowGuard can automatically fix certain types of issues:

### Available Auto-fixes

- Code formatting issues
- Simple security improvements
- Common performance optimizations
- Style guide violations

### Applying Fixes

1. In the Verification view, identify issues with auto-fixes available
2. Click the "Apply Fix" button next to individual issues
3. Or click "Apply All Fixes" to fix all applicable issues at once
4. Review the changes before committing

## Ignoring Issues

Not all identified issues need to be fixed. You can ignore issues that are:

- False positives
- Acceptable technical debt
- Intentional deviations from recommendations

### Ignoring Individual Issues

1. In the Verification view, find the issue you want to ignore
2. Click the "Ignore" button
3. Provide a reason for ignoring the issue
4. The issue will be marked as ignored and won't appear in future verifications

### Ignoring by Pattern

You can configure FlowGuard to ignore issues matching specific patterns:

1. Open VS Code Settings
2. Search for "FlowGuard Verification Ignore Patterns"
3. Add file paths, line patterns, or issue types to ignore

## Approval Workflow

After verification and any necessary fixes, changes need to be approved:

### Approval Options

- **Approve**: Changes are acceptable as-is
- **Approve with Conditions**: Changes are acceptable with noted conditions
- **Request Changes**: Additional work is needed before approval

### Approval Process

1. Review all verification results
2. Apply necessary fixes or ignore acceptable issues
3. Click "Approve Changes" in the Verification view
4. Add any conditional notes if using "Approve with Conditions"
5. The approval is recorded in the verification execution record

## Example Verification Report

```markdown
# Verification Report - User Authentication Implementation

## Summary
- Total Issues: 8
- Critical: 1
- High: 2
- Medium: 3
- Low: 2

## Issues

### Critical
**Hardcoded API Key**
- File: src/config/auth.js:15
- Description: API key is hardcoded in source code
- Recommendation: Move API key to environment variables
- Auto-fix Available: No

### High
**Missing Input Validation**
- File: src/controllers/auth.controller.ts:42
- Description: User input is not validated before processing
- Recommendation: Add validation for email and password fields
- Auto-fix Available: No

**Insecure Password Storage**
- File: src/utils/auth.util.ts:23
- Description: Passwords stored without proper hashing
- Recommendation: Use bcrypt or similar secure hashing
- Auto-fix Available: Yes

### Medium
**Missing Error Handling**
- File: src/services/auth.service.ts:67
- Description: Database errors are not properly handled
- Recommendation: Add try/catch blocks around database operations
- Auto-fix Available: No

## Approval Status
- Approved with Conditions: Fix critical and high severity issues before merging
- Reviewer: Jane Developer
- Date: 2024-01-16
```

## Configuration

### Severity Rating

You can customize how severity is determined:

```json
{
  "flowguard.verification.severity.critical": ["security.vulnerability", "functionality.breaking"],
  "flowguard.verification.severity.high": ["security.warning", "performance.impact"],
  "flowguard.verification.severity.medium": ["style.warning", "maintainability.issue"],
  "flowguard.verification.severity.low": ["style.suggestion", "naming.convention"]
}
```

### Rule Customization

Disable or customize specific verification rules:

```json
{
  "flowguard.verification.rules.disabled": [
    "style.line-length",
    "naming.variable-camel-case"
  ],
  "flowguard.verification.rules.custom": {
    "security.api-key-check": {
      "severity": "critical",
      "patterns": ["/api/key/", "API_KEY\\s*="]
    }
  }
}
```

## Integration with CI/CD

FlowGuard can be integrated into your CI/CD pipeline:

### GitHub Actions

```yaml
- name: FlowGuard Verification
  uses: flowguard/verify-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    fail-on: critical
```

### GitLab CI

```yaml
flowguard-verify:
  image: flowguard/cli:latest
  script:
    - flowguard verify --gitlab-mr $CI_MERGE_REQUEST_IID
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Best Practices

### Verification Timing

- Run verification frequently during development
- Always run verification before creating PRs/MRs
- Configure automated verification in CI/CD pipelines

### Issue Management

- Address Critical and High severity issues immediately
- Regularly review Medium severity issues for improvement opportunities
- Document reasons for ignoring issues to maintain knowledge

### Approval Process

- Have multiple team members review and approve significant changes
- Use "Approve with Conditions" when minor issues are acceptable
- Maintain a log of approvals for audit purposes

## Troubleshooting

### Verification Not Running

- Ensure FlowGuard is properly configured with an LLM provider
- Check that the diff input is valid and accessible
- Verify network connectivity if using cloud-based verification

### False Positives

- Use the ignore feature for known false positives
- Report false positives to the FlowGuard team
- Customize rules to better match your codebase

### Performance Issues

- Limit the scope of verification to changed files only
- Adjust `flowguard.verification.maxFiles` setting for large changes
- Consider running detailed verification in CI/CD rather than locally

## Next Steps

After running verification:

1. [Apply auto-fixes](#applying-fixes) for simple issues
2. [Address remaining issues](#understanding-verification-results) manually
3. [Approve changes](#approval-process) once satisfied with quality

For a guided walkthrough, try the [Verification Tutorial](../tutorials/verification-tutorial.md).