import { describe, it, expect, beforeEach } from '@jest/globals';
import { TicketValidator } from '../../../src/planning/TicketValidator';
import { Ticket } from '../../../src/core/models/Ticket';
import { Spec } from '../../../src/core/models/Spec';
import { v4 as uuidv4 } from 'uuid';

function createTestTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: uuidv4(),
    epicId: uuidv4(),
    specId: uuidv4(),
    title: 'Test Ticket',
    status: 'todo',
    priority: 'medium',
    tags: [],
    content: '# Test Ticket\n\n## Description\nTest description\n\n## Acceptance Criteria\n- [ ] Criterion 1\n- [ ] Criterion 2\n\n## Implementation Steps\n- Step 1\n- Step 2\n\n## Files to Change\n- `src/test.ts`\n',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function createTestSpec(overrides: Partial<Spec> = {}): Spec {
  return {
    id: uuidv4(),
    epicId: uuidv4(),
    title: 'Test Spec',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'Test Author',
    tags: [],
    content: '# Test Spec\n\n### Files to Change\n- `src/test.ts`\n\n### Functional Requirements\n1. Requirement 1\n2. Requirement 2\n',
    ...overrides
  };
}

describe('TicketValidator', () => {
  let validator: TicketValidator;

  beforeEach(() => {
    validator = new TicketValidator();
  });

  describe('validateTicketCompleteness', () => {
    it('should pass for a complete ticket', () => {
      const completeTicket = createTestTicket({
        title: 'Implement feature X',
        content: '# Implement feature X\n\n## Description\nImplement feature X\n\n## Acceptance Criteria\n- [ ] Feature X implemented\n- [ ] Tests pass\n\n## Implementation Steps\n- Create file\n- Implement logic\n- Add tests\n\n## Files to Change\n- `src/test.ts`\n',
        estimatedEffort: '4h',
        priority: 'high'
      });

      const result = validator.validateTicketCompleteness(completeTicket);

      expect(result.valid).toBe(true);
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0);
    });

    it('should fail for missing title', () => {
      const ticketWithEmptyTitle = createTestTicket({
        title: '',
        content: '# Test\n\n## Description\nTest\n\n## Acceptance Criteria\n- [ ] Criterion\n\n## Implementation Steps\n- Step\n\n## Files to Change\n- `file.ts`\n'
      });

      const result = validator.validateTicketCompleteness(ticketWithEmptyTitle);

      expect(result.valid).toBe(false);
      expect(result.issues.some(e => e.field === 'title')).toBe(true);
    });

    it('should fail for missing content', () => {
      const ticketWithEmptyContent = createTestTicket({
        content: ''
      });

      const result = validator.validateTicketCompleteness(ticketWithEmptyContent);

      expect(result.valid).toBe(false);
      expect(result.issues.some(e => e.field === 'content')).toBe(true);
    });

    it('should fail for invalid estimated effort format', () => {
      const ticketWithInvalidEffort = createTestTicket({
        estimatedEffort: 'invalid-format'
      });

      const result = validator.validateTicketCompleteness(ticketWithInvalidEffort);

      expect(result.issues.some(e => e.field === 'estimatedEffort')).toBe(true);
    });

    it('should validate effort format with correct patterns', () => {
      const validEfforts = ['2h', '4h', '1d', '3d'];

      for (const effort of validEfforts) {
        const ticket = createTestTicket({ estimatedEffort: effort });
        const result = validator.validateTicketCompleteness(ticket);
        const effortIssue = result.issues.find(e => e.field === 'estimatedEffort');
        expect(effortIssue).toBeUndefined();
      }

      const invalidEfforts = ['invalid', '2hours', 'two hours', '1w'];
      for (const effort of invalidEfforts) {
        const ticket = createTestTicket({ estimatedEffort: effort });
        const result = validator.validateTicketCompleteness(ticket);
        const effortIssue = result.issues.find(e => e.field === 'estimatedEffort');
        expect(effortIssue).toBeDefined();
        expect(effortIssue?.severity).toBe('warning');
      }
    });
  });

  describe('validateTicketAlignment', () => {
    it('should validate spec reference consistency', () => {
      const specId = uuidv4();
      const ticket = createTestTicket({
        specId,
        content: '# Test Ticket\n\nContent with spec:' + specId + ' reference\n\n## Description\nTest\n\n## Acceptance Criteria\n- [ ] Criterion\n\n## Implementation Steps\n- Step\n\n## Files to Change\n- `src/test.ts`\n'
      });
      const spec = createTestSpec({ id: specId });

      const result = validator.validateTicketAlignment(ticket, spec);

      expect(result.valid).toBe(true);
    });

    it('should fail for specId mismatch', () => {
      const ticket = createTestTicket({
        specId: uuidv4()
      });
      const spec = createTestSpec({ id: uuidv4() });

      const result = validator.validateTicketAlignment(ticket, spec);

      expect(result.valid).toBe(false);
      expect(result.issues.some(e => e.field === 'specId')).toBe(true);
    });

    it('should warn for missing spec reference in content', () => {
      const specId = uuidv4();
      const ticket = createTestTicket({
        specId,
        content: '# Test Ticket\n\nContent without reference\n\n## Description\nTest\n\n## Acceptance Criteria\n- [ ] Criterion\n\n## Implementation Steps\n- Step\n\n## Files to Change\n- `src/test.ts`\n'
      });
      const spec = createTestSpec({ id: specId });

      const result = validator.validateTicketAlignment(ticket, spec);

      expect(result.issues.some(e => e.field === 'content')).toBe(true);
    });
  });

  describe('error severity levels', () => {
    it('should have errors with appropriate severity', () => {
      const ticket = createTestTicket({
        title: '',
        content: ''
      });

      const result = validator.validateTicketCompleteness(ticket);

      expect(result.issues.length).toBeGreaterThan(0);
      const errorIssues = result.issues.filter(i => i.severity === 'error');
      expect(errorIssues.length).toBeGreaterThan(0);
    });
  });
});
