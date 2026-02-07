"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TicketValidator_1 = require("../../src/planning/TicketValidator");
(0, vitest_1.describe)('TicketValidator', () => {
    let validator;
    (0, vitest_1.beforeEach)(() => {
        validator = new TicketValidator_1.TicketValidator();
    });
    (0, vitest_1.describe)('validateTicketCompleteness', () => {
        (0, vitest_1.it)('should pass for a complete ticket', () => {
            const completeTicket = {
                title: 'Implement feature X',
                description: 'Implement feature X according to spec',
                acceptanceCriteria: ['Feature X implemented', 'Tests pass'],
                implementationSteps: ['Create file', 'Implement logic', 'Add tests'],
                filesToChange: [{ path: 'src/test.ts', description: 'Implement feature' }],
                estimatedEffort: '4h',
                priority: 'high',
                tags: ['feature']
            };
            const result = validator.validateTicketCompleteness(completeTicket);
            (0, vitest_1.expect)(result.isValid).toBe(true);
            (0, vitest_1.expect)(result.errors).toHaveLength(0);
        });
        (0, vitest_1.it)('should fail for missing required fields', () => {
            const incompleteTicket = {
                title: 'Implement feature X',
                description: '',
                acceptanceCriteria: [],
                implementationSteps: [],
                filesToChange: [],
                estimatedEffort: '',
                priority: 'medium',
                tags: []
            };
            const result = validator.validateTicketCompleteness(incompleteTicket);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should validate title is not empty', () => {
            const ticketWithEmptyTitle = {
                title: '',
                description: 'Test description',
                acceptanceCriteria: ['Criteria 1'],
                implementationSteps: ['Step 1'],
                filesToChange: [{ path: 'src/test.ts', description: 'Test' }],
                estimatedEffort: '2h',
                priority: 'low',
                tags: []
            };
            const result = validator.validateTicketCompleteness(ticketWithEmptyTitle);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(e => e.field === 'title')).toBe(true);
        });
        (0, vitest_1.it)('should validate estimated effort format', () => {
            const ticketWithInvalidEffort = {
                title: 'Test Ticket',
                description: 'Test description',
                acceptanceCriteria: [],
                implementationSteps: [],
                filesToChange: [],
                estimatedEffort: 'invalid-format',
                priority: 'medium',
                tags: []
            };
            const result = validator.validateTicketCompleteness(ticketWithInvalidEffort);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(e => e.field === 'estimatedEffort')).toBe(true);
        });
        (0, vitest_1.it)('should validate priority enum values', () => {
            const ticketWithInvalidPriority = {
                title: 'Test Ticket',
                description: 'Test description',
                acceptanceCriteria: [],
                implementationSteps: [],
                filesToChange: [],
                estimatedEffort: '',
                priority: 'invalid',
                tags: []
            };
            const result = validator.validateTicketCompleteness(ticketWithInvalidPriority);
            (0, vitest_1.expect)(result.isValid).toBe(false);
            (0, vitest_1.expect)(result.errors.some(e => e.field === 'priority')).toBe(true);
        });
    });
    (0, vitest_1.describe)('validateTicketAlignment', () => {
        (0, vitest_1.it)('should validate spec reference consistency', () => {
            const ticket = {
                title: 'Test Ticket',
                description: 'Implement feature [spec:12345]',
                acceptanceCriteria: [],
                implementationSteps: [],
                filesToChange: [],
                estimatedEffort: '',
                priority: 'medium',
                tags: [],
                specReferences: ['12345']
            };
            const result = validator.validateTicketAlignment(ticket, ['12345']);
            (0, vitest_1.expect)(result.isValid).toBe(true);
        });
        (0, vitest_1.it)('should fail for missing spec references', () => {
            const ticket = {
                title: 'Test Ticket',
                description: 'Implement feature [spec:99999]',
                acceptanceCriteria: [],
                implementationSteps: [],
                filesToChange: [],
                estimatedEffort: '',
                priority: 'medium',
                tags: [],
                specReferences: ['99999']
            };
            const result = validator.validateTicketAlignment(ticket, ['12345']);
            (0, vitest_1.expect)(result.isValid).toBe(false);
        });
    });
    (0, vitest_1.describe)('error severity levels', () => {
        (0, vitest_1.it)('should assign appropriate severity to errors', () => {
            const ticket = {
                title: '',
                description: '',
                acceptanceCriteria: [],
                implementationSteps: [],
                filesToChange: [],
                estimatedEffort: '',
                priority: 'invalid',
                tags: []
            };
            const result = validator.validateTicketCompleteness(ticket);
            (0, vitest_1.expect)(result.errors.length).toBeGreaterThan(0);
            result.errors.forEach(error => {
                (0, vitest_1.expect)(error.severity).toBeDefined();
            });
        });
    });
});
//# sourceMappingURL=TicketValidator.test.js.map