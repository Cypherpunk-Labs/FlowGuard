"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ClarificationEngine_1 = require("../../src/planning/ClarificationEngine");
const mocks_1 = require("../../utils/mocks");
(0, vitest_1.describe)('ClarificationEngine', () => {
    let engine;
    let mockLLMProvider;
    (0, vitest_1.beforeEach)(() => {
        mockLLMProvider = (0, mocks_1.createMockLLMProvider)();
        engine = new ClarificationEngine_1.ClarificationEngine(mockLLMProvider);
    });
    (0, vitest_1.describe)('generateQuestions', () => {
        (0, vitest_1.it)('should return questions for a feature goal', async () => {
            const context = {
                goal: 'Add user authentication',
                goalType: 'feature',
                currentContext: 'Building a new API endpoint'
            };
            const questions = await engine.generateQuestions(context);
            (0, vitest_1.expect)(questions).toBeDefined();
            (0, vitest_1.expect)(Array.isArray(questions)).toBe(true);
        });
        (0, vitest_1.it)('should return questions for a bugfix goal', async () => {
            const context = {
                goal: 'Fix the login page crash',
                goalType: 'bugfix',
                currentContext: 'Users report crashes on iOS Safari'
            };
            const questions = await engine.generateQuestions(context);
            (0, vitest_1.expect)(questions).toBeDefined();
            (0, vitest_1.expect)(questions.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should return questions for a refactor goal', async () => {
            const context = {
                goal: 'Refactor the payment processing module',
                goalType: 'refactor',
                currentContext: 'Code is difficult to maintain'
            };
            const questions = await engine.generateQuestions(context);
            (0, vitest_1.expect)(questions).toBeDefined();
            (0, vitest_1.expect)(questions.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle LLM provider errors gracefully', async () => {
            const mockProviderWithError = (0, mocks_1.createMockLLMProvider)();
            mockProviderWithError.generateStructured = async () => {
                throw new Error('LLM provider failed');
            };
            const engineWithError = new ClarificationEngine_1.ClarificationEngine(mockProviderWithError);
            const context = {
                goal: 'Test goal',
                goalType: 'feature',
                currentContext: 'Test context'
            };
            await (0, vitest_1.expect)(engineWithError.generateQuestions(context)).rejects.toThrow('LLM provider failed');
        });
    });
});
//# sourceMappingURL=ClarificationEngine.test.js.map