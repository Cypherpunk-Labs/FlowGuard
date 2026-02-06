I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Jest tooling still not implemented per original user request

**Full Review Thread Context:** Original comment flagged misalignment with user request for Jest (`jest.config.js`, TypeScript support). Further comment confirmed Vitest implementation instead, no Jest added. **Root Issue:** User explicitly requested Jest tooling, but Vitest (matching existing tests) was chosen without addressing request. **Complete Solution:** 1. Install Jest deps: `npm i -D jest ts-jest @types/jest @jest/globals`. 2. Create `jest.config.js` mirroring `vitest.config.ts`: TypeScript (`ts-jest`), paths (`moduleNameMapper`), coverage (`collectCoverageFrom: ['src/**/*.ts']`, threshold 60%), testMatch `['**/*.{test,spec}.ts']`, testEnvironment 'node'. 3. Update `package.json` scripts: `test: jest`, `test:watch: jest --watch`, `test:coverage: jest --coverage`. Retain Vitest for existing `__tests__/` if needed via separate scripts. 4. Migrate new `tests/unit/` to Jest syntax if differences (expect.extend etc.), update imports. 5. Verify: `npm test` runs Jest, coverage >=60%, all tests pass. **Bigger Picture:** Aligns exactly with user spec while preserving Vitest for legacy if co-existence viable. Test both runners in CI if transitional.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/package.json
- /Users/mkemp/repos/tmp-traycer-cp/vitest.config.ts
---
## Comment 2: Remaining unit tests still missing despite partial implementation

**Complete Thread Context:** Original flagged missing storage CRUD/planning engines/verification matching/rating/feedback/codebase/diagrams/templates despite plan. First further noted implemented subset (models/fileSystem/Clarification/TicketValidator/DiffAnalyzer). Current: Added storage CRUD/EpicMetadata, SpecGen/TickGen/Mermaid, SpecMatcher/SeverityRater. **Root Cause:** Incomplete test pyramid leaves orchestration/verification untested. **Actionable Steps:** 1. `tests/unit/planning/WorkflowOrchestrator.test.ts`: Mock LLM/engines, test full workflow (goal→spec→tickets), state transitions/progress. 2. `tests/unit/planning/codebase/CodebaseExplorer.test.ts`: Mock FS/TypeScriptAnalyzer, test scan/filter/symbols/graph. `TypeScriptAnalyzer.test.ts`: Mock TS API, extract symbols/imports. `FileScanner.test.ts`: Globs/.gitignore. 3. `tests/unit/planning/templates/TicketTemplates.test.ts`: get/apply/validate/custom. 4. `tests/unit/verification/FeedbackGenerator.test.ts`: Grouping/suggestions/markdown. `VerificationEngine.test.ts`: E2E diff→feedback. `adapters/GitDiffAdapter.test.ts` etc.: Format-specific parsing. 5. Integrate `tests/utils/` mocks (`createMockLLMProvider`, `createTestEpic`). 6. Run `npm run test:coverage`; add tests until 60% met (`src/**/*.ts`). **Architecture Fit:** Complements models/storage units with engine behavior tests; mocks VSCode/FS/LLM ensure isolation. **Validate:** All tests pass, coverage report shows >=60%.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/tests/unit/planning
- /Users/mkemp/repos/tmp-traycer-cp/tests/unit/verification
- /Users/mkemp/repos/tmp-traycer-cp/tests/utils
- /Users/mkemp/repos/tmp-traycer-cp/vitest.config.ts
---