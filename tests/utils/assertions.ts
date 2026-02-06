import { Spec, Ticket, VerificationIssue } from '../../../src/core/models';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidSpec(): R;
      toMatchSpecRequirement(requirement: string): R;
      toHaveValidFrontmatter(): R;
      toHaveSeverity(expected: 'Critical' | 'High' | 'Medium' | 'Low'): R;
      toHaveApprovalStatus(expected: 'approved' | 'approved_with_conditions' | 'changes_requested' | 'pending'): R;
    }
  }
}

expect.extend({
  toBeValidSpec(this: jest.MatcherContext, received: Spec): jest.CustomMatcherResult {
    const spec = received as Spec;
    const errors: string[] = [];

    if (!spec.id) errors.push('Missing spec id');
    if (!spec.epicId) errors.push('Missing epicId');
    if (!spec.title) errors.push('Missing title');
    if (!spec.content) errors.push('Missing content');
    if (!spec.author) errors.push('Missing author');
    if (!['draft', 'in_review', 'approved', 'archived'].includes(spec.status)) {
      errors.push('Invalid status');
    }

    const pass = errors.length === 0;
    return {
      pass,
      message: pass
        ? () => `Expected spec not to be valid`
        : () => `Expected spec to be valid but found issues: ${errors.join(', ')}`,
    };
  },

  toMatchSpecRequirement(this: jest.MatcherContext, received: VerificationIssue | string, requirement: string): jest.CustomMatcherResult {
    const issue = received as VerificationIssue;
    const issueContent = issue?.message || issue || '';
    const pass = typeof issueContent === 'string' && issueContent.toLowerCase().includes(requirement.toLowerCase());
    return {
      pass,
      message: pass
        ? () => `Expected issue not to match requirement: ${requirement}`
        : () => `Expected issue "${issueContent}" to match requirement: ${requirement}`,
    };
  },

  toHaveValidFrontmatter(this: jest.MatcherContext, received: string): jest.CustomMatcherResult {
    const content = received as string;
    const hasFrontmatter = content.startsWith('---') && !!content.match(/^---\s*\n/);
    const pass = !!hasFrontmatter;
    return {
      pass,
      message: pass
        ? () => `Expected content not to have valid frontmatter`
        : () => `Expected content to have valid YAML frontmatter (--- ... ---)`,
    };
  },

  toHaveSeverity(this: jest.MatcherContext, received: VerificationIssue, expected: 'Critical' | 'High' | 'Medium' | 'Low'): jest.CustomMatcherResult {
    const pass = received.severity === expected;
    return {
      pass,
      message: pass
        ? () => `Expected issue not to have severity: ${expected}`
        : () => `Expected issue to have severity "${expected}" but found "${received.severity}"`,
    };
  },

  toHaveApprovalStatus(this: jest.MatcherContext, received: any, expected: 'approved' | 'approved_with_conditions' | 'changes_requested' | 'pending'): jest.CustomMatcherResult {
    const summary = received?.summary || received;
    const pass = summary?.approvalStatus === expected;
    return {
      pass,
      message: pass
        ? () => `Expected verification not to have approval status: ${expected}`
        : () => `Expected verification to have approval status "${expected}" but found "${summary?.approvalStatus}"`,
    };
  },
});
