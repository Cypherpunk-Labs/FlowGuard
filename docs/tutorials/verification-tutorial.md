# Verification Tutorial

This tutorial teaches you how to use FlowGuard's verification system to ensure code quality and adherence to specifications when making changes.

## What You'll Learn

- How to run verification on your code changes
- Interpreting verification results and identified issues
- Applying automatic fixes for common issues
- Approving verification results to complete the workflow
- Integrating verification into your development process

## Prerequisites

- FlowGuard extension installed and activated
- A workspace with existing code or a new project
- Git repository initialized (recommended but not required)

## Steps

### 1. Make Code Changes

Before verification, you need code changes to verify:

1. Open any source file in your project
2. Make a small change to the code (e.g., add a function, modify a variable)
3. Save the file
4. Optionally commit your changes to Git

### 2. Run Verification

FlowGuard can verify changes from various sources:

1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "FlowGuard: Verify Changes" and select the command
3. Choose your diff source:
   - **Git Diff**: Compare against the last commit
   - **GitHub PR**: Verify a GitHub pull request
   - **File Changes**: Verify changes in the current file
4. Wait for verification to complete

### 3. Review Verification Results

After verification completes, review the results:

1. Check the FlowGuard sidebar for verification results
2. Review any identified issues in detail
3. Note the severity levels:
   - **Critical**: Must be addressed before merging
   - **High**: Should be addressed soon
   - **Medium**: Consider addressing when possible
   - **Low**: Minor issues or suggestions
4. Examine code snippets showing where issues were found

### 4. Apply Auto-fixes

FlowGuard can automatically fix certain types of issues:

1. Find an issue with an auto-fix available (marked with a wrench icon)
2. Click the "Apply Fix" button next to the issue
3. Review the changes in the diff view
4. Accept or reject the changes as appropriate

### 5. Approve Changes

Once you're satisfied with your changes and any fixes:

1. Use the command palette to run "FlowGuard: Approve Verification"
2. Add any conditional notes if needed (e.g., "Issue #3 not fixed due to...")
3. Confirm the approval
4. The verification results are now marked as approved

## Integration with Development Workflow

To get the most out of FlowGuard verification:

- Run verification frequently during development
- Address critical and high severity issues before committing
- Use auto-fixes for simple, repetitive issues
- Review medium and low severity issues periodically
- Approve verification results before merging pull requests

## Verification Sources

FlowGuard supports multiple verification sources:

- **Git Diff**: Compare working directory against last commit
- **GitHub PR**: Analyze GitHub pull requests for issues
- **File Changes**: Focus on changes in the currently open file
- **Custom Diff**: Provide custom diff content for analysis

## Next Steps

After completing this tutorial, consider:

- Reading more about verification workflows in the [Verification Workflows](../guides/verification.md) guide
- Exploring the First Epic Tutorial if you haven't already
- Learning about plugin development to create custom verification rules

## Troubleshooting

If you encounter issues:

- Ensure FlowGuard is properly installed and activated
- Check that your workspace has code changes to verify
- Verify your FlowGuard configuration in VS Code settings
- Consult the [Troubleshooting](../troubleshooting.md) guide for common issues