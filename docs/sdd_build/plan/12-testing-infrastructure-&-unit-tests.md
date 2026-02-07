I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

## Observations

The codebase already uses **Vitest** (not Jest) as evidenced by existing test files importing from `'vitest'`. Tests are organized in `__tests__/unit/` and `__tests__/integration/` subdirectories within modules. The project has comprehensive TypeScript models with validators, a storage layer handling CRUD operations, planning engine components for spec/ticket generation, and verification engine for diff analysis. No Vitest configuration or testing dependencies are currently installed in `package.json`.

## Approach

Set up Vitest testing infrastructure with TypeScript support, create comprehensive unit tests for core models, storage layer, planning engine, and verification engine components. Organize tests in a top-level `tests/` directory following the existing pattern of `unit/` subdirectories. Configure Vitest to work with VS Code extension environment, mock external dependencies (VS Code API, file system, LLM providers), and target 60% code coverage. Use existing test files as reference for mocking patterns and assertion styles.

## Implementation Steps

### 1. Install Testing Dependencies and Configure Vitest

**Install Vitest and related packages:**
- Add `vitest`, `@vitest/ui`, `@vitest/coverage-v8` as dev dependencies
- Add `@types/node` (already present, verify version compatibility)
- Add `happy-dom` or `jsdom` for DOM testing (for webview components if needed)

**Create `vitest.config.ts` in project root:**
- Configure test environment as `node` (VS Code extension runs in Node.js)
- Set up TypeScript path resolution matching `tsconfig.json`
- Configure coverage settings: provider `v8`, reporter `['text', 'json', 'html']`, threshold 60%
- Include patterns: `src/**/*.{test,spec}.ts`, `tests/**/*.{test,spec}.ts`
- Exclude patterns: `node_modules`, `out`, `dist`, `**/*.d.ts`, `src/ui/**` (webview code)
- Set up globals: `true` to avoid importing `describe`, `it`, `expect` in every file
- Configure test timeout: 10000ms for LLM-related tests

**Update `package.json` scripts:**
- Modify `test` script to run `vitest run`
- Add `test:watch` script: `vitest watch`
- Add `test:ui` script: `vitest --ui`
- Add `test:coverage` script: `vitest run --coverage`
- Update `pretest` script to compile TypeScript before tests

**Create `tests/setup.ts` for global test setup:**
- Mock VS Code API (`vscode` module) with basic stubs for commonly used APIs
- Set up global test utilities and helpers
- Configure test environment variables

### 2. Create Test Utilities and Mocks

**Create `tests/utils/` directory with shared utilities:**

**`tests/utils/mocks.ts`:**
- `createMockVSCodeContext()` - Mock VS Code extension context with secrets, workspace, etc.
- `createMockWorkspaceFolder()` - Mock workspace folder structure
- `createMockLLMProvider()` - Mock LLM provider (reference existing pattern in `file:src/planning/__tests__/integration/workflow.test.ts`)
- `createMockFileSystem()` - Mock file system operations with in-memory storage
- `createMockGitHelper()` - Mock Git operations

**`tests/utils/fixtures.ts`:**
- `createTestEpic()` - Factory function for test Epic objects
- `createTestSpec()` - Factory function for test Spec objects
- `createTestTicket()` - Factory function for test Ticket objects
- `createTestExecution()` - Factory function for test Execution objects
- `createTestVerification()` - Factory function for test Verification objects
- Helper functions to create valid frontmatter + markdown content

**`tests/utils/assertions.ts`:**
- Custom matchers for common assertions (e.g., `toBeValidUUID()`, `toHaveValidFrontmatter()`)
- Helper functions for deep equality checks on model objects

### 3. Write Unit Tests for Core Models

**Create `tests/unit/models/` directory:**

**`tests/unit/models/Epic.test.ts`:**
- Test Epic interface structure and type safety
- Test Phase and Deliverable interfaces
- Test EpicStatus and PhaseStatus enums
- Test EpicMetadata structure with optional fields

**`tests/unit/models/Spec.test.ts`:**
- Test Spec interface structure
- Test SpecStatus enum values
- Test required vs optional fields

**`tests/unit/models/Ticket.test.ts`:**
- Test Ticket interface structure
- Test TicketStatus and Priority enums
- Test optional fields (assignee, estimatedEffort)

**`tests/unit/models/Execution.test.ts`:**
- Test Execution interface structure
- Test ExecutionStatus and AgentType enums
- Test results field structure

**`tests/unit/models/Verification.test.ts`:**
- Test Verification interface structure
- Test Severity and IssueCategory enums
- Test VerificationIssue structure
- Test VerificationSummary with issue counts

**`tests/unit/models/validators.test.ts`:**
- Test `validateEpic()` with valid and invalid data
- Test `validateSpec()` with missing required fields
- Test `validateTicket()` with invalid enum values
- Test `validateExecution()` with malformed dates
- Test `validateVerification()` with complex nested structures
- Test error messages for validation failures
- Test edge cases: empty strings, null values, undefined fields

### 4. Write Unit Tests for Storage Layer

**Create `tests/unit/storage/` directory:**

**`tests/unit/storage/ArtifactStorage.test.ts`:**
- Test `initialize()` creates directory structure (`.flowguard/specs/`, `.flowguard/tickets/`, etc.)
- Test `saveSpec()` serializes frontmatter and writes file
- Test `loadSpec()` parses frontmatter and returns Spec object
- Test `listSpecs()` filters by epicId
- Test `deleteSpec()` removes file and throws NotFoundError if missing
- Test `saveTicket()`, `loadTicket()`, `listTickets()`, `deleteTicket()` (similar to spec tests)
- Test `saveExecution()`, `loadExecution()`, `listExecutions()`, `deleteExecution()`
- Test `saveVerification()`, `loadVerification()`, `listVerifications()`, `deleteVerification()`
- Test `getArtifactPath()` returns correct paths for each artifact type
- Test template operations: `saveTemplate()`, `loadTemplate()`, `listTemplates()`, `deleteTemplate()`
- Test error handling: ValidationError for malformed frontmatter, NotFoundError for missing files
- Mock file system operations using `tests/utils/mocks.ts`

**`tests/unit/storage/EpicMetadataManager.test.ts`:**
- Test reading and writing `epic.json` metadata file
- Test updating epic metadata fields
- Test validation of epic metadata structure
- Test error handling for corrupted JSON

**`tests/unit/storage/fileSystem.test.ts`:**
- Test `fileExists()` checks file existence
- Test `readFile()` reads file content
- Test `writeFile()` writes content to file
- Test `listFiles()` with regex pattern matching
- Test `deleteFile()` removes file
- Test `ensureDirectory()` creates directory recursively
- Mock Node.js `fs` module using Vitest's `vi.mock()`

### 5. Write Unit Tests for Planning Engine Components

**Create `tests/unit/planning/` directory:**

**`tests/unit/planning/ClarificationEngine.test.ts`:**
- Test `generateQuestions()` returns 2-3 targeted questions
- Test question generation with different goal types (feature, bugfix, refactor)
- Test handling of clear vs ambiguous goals
- Test LLM provider integration with mocked responses
- Test error handling when LLM fails

**`tests/unit/planning/SpecGenerator.test.ts`:**
- Test `generateSpec()` creates spec with frontmatter and markdown content
- Test spec content includes: overview, architecture, requirements, NFRs, technical plan, testing strategy
- Test Mermaid diagram generation and insertion
- Test codebase context integration
- Test handling of clarification answers
- Test spec validation before saving
- Mock LLM provider and codebase explorer

**`tests/unit/planning/TicketGenerator.test.ts`:**
- Test `generateTickets()` breaks down spec into multiple tickets
- Test ticket structure: title, description, acceptance criteria, implementation steps, files to change
- Test ticket prioritization (high/medium/low)
- Test estimated effort calculation
- Test spec reference linking (`[spec:spec-id]`)
- Test different ticket types (feature, bugfix, refactor, test, documentation)
- Mock LLM provider responses with structured ticket data

**`tests/unit/planning/TicketValidator.test.ts`:**
- Test `validateTicketCompleteness()` checks required fields
- Test validation of title, description, acceptance criteria
- Test validation of estimated effort format (e.g., "2h", "3d", "1w")
- Test validation of priority enum values
- Test `validateTicketAlignment()` checks spec reference consistency
- Test validation of file paths in "Files to Change" section
- Test error and warning severity levels

**`tests/unit/planning/WorkflowOrchestrator.test.ts`:**
- Test complete workflow: goal → clarification → spec → tickets
- Test workflow state management and phase transitions
- Test progress callbacks during workflow execution
- Test error recovery and rollback
- Test workflow with skipped clarification phase
- Test workflow summary calculation
- Reference existing integration test in `file:src/planning/__tests__/integration/workflow.test.ts` for patterns

**`tests/unit/planning/codebase/CodebaseExplorer.test.ts`:**
- Test `explore()` scans workspace files
- Test file filtering by include/exclude patterns
- Test symbol extraction from TypeScript files
- Test dependency graph building
- Test caching and incremental scanning
- Mock file system and TypeScript Compiler API

**`tests/unit/planning/codebase/TypeScriptAnalyzer.test.ts`:**
- Test parsing TypeScript files and extracting symbols (classes, functions, interfaces)
- Test import/export analysis
- Test type information extraction
- Mock TypeScript Compiler API

**`tests/unit/planning/codebase/FileScanner.test.ts`:**
- Test scanning directories with glob patterns
- Test file filtering by extension
- Test respecting .gitignore patterns
- Test performance with large codebases (mock large file lists)

**`tests/unit/planning/diagrams/MermaidGenerator.test.ts`:**
- Test generating sequence diagrams
- Test generating flowcharts
- Test generating class diagrams
- Test diagram validation and syntax checking
- Test diagram insertion into markdown content

**`tests/unit/planning/templates/TicketTemplates.test.ts`:**
- Test `getTemplate()` returns correct template for ticket type
- Test `applyTemplate()` substitutes variables correctly
- Test template validation
- Test custom template loading
- Reference existing test in `file:src/planning/__tests__/integration/workflow.test.ts` lines 488-556

### 6. Write Unit Tests for Verification Engine Components

**Create `tests/unit/verification/` directory:**

**`tests/unit/verification/DiffAnalyzer.test.ts`:**
- Already exists at `file:src/verification/__tests__/unit/DiffAnalyzer.test.ts`
- Move to `tests/unit/verification/` for consistency
- Ensure comprehensive coverage of all diff formats (git, GitHub, GitLab, unified)
- Add tests for edge cases: binary files, large diffs, malformed diffs

**`tests/unit/verification/SpecMatcher.test.ts`:**
- Test `matchChangesToSpec()` maps code changes to spec requirements
- Test semantic matching using LLM
- Test confidence scoring for matches
- Test handling of changes not matching any spec requirement
- Test multiple specs matching same change
- Mock LLM provider for semantic analysis

**`tests/unit/verification/SeverityRater.test.ts`:**
- Test `rateDeviation()` classifies issues as Critical/High/Medium/Low
- Test severity rating for different issue categories (security, performance, logic, style)
- Test reasoning generation for severity ratings
- Test edge cases: missing spec requirements, ambiguous changes
- Mock LLM provider for severity analysis

**`tests/unit/verification/FeedbackGenerator.test.ts`:**
- Test `generateFeedback()` creates structured verification reports
- Test issue grouping by severity and category
- Test fix suggestion generation with code examples
- Test automated fix detection
- Test report formatting (markdown output)
- Mock LLM provider for feedback generation

**`tests/unit/verification/VerificationEngine.test.ts`:**
- Test end-to-end verification workflow: diff → analysis → matching → rating → feedback
- Test integration of DiffAnalyzer, SpecMatcher, SeverityRater, FeedbackGenerator
- Test verification summary calculation
- Test approval status determination
- Test saving verification results to storage

**`tests/unit/verification/adapters/GitDiffAdapter.test.ts`:**
- Test parsing standard git diff format
- Test extracting file paths, line numbers, changes
- Test handling of renamed/moved files

**`tests/unit/verification/adapters/GitHubAdapter.test.ts`:**
- Test parsing GitHub PR API response
- Test extracting file changes from PR diff
- Test handling of PR metadata (author, commit hash, message)

**`tests/unit/verification/adapters/GitLabAdapter.test.ts`:**
- Test parsing GitLab MR API response
- Test extracting file changes from MR diff
- Test handling of MR metadata

### 7. Configure Coverage Reporting and Thresholds

**Update `vitest.config.ts` coverage settings:**
- Set coverage threshold: 60% for statements, branches, functions, lines
- Configure coverage reporters: `text` (console), `html` (browser), `json` (CI)
- Exclude patterns: `**/__tests__/**`, `**/node_modules/**`, `**/out/**`, `**/*.d.ts`, `src/ui/**`
- Include patterns: `src/**/*.ts` (exclude webview code)

**Create `.gitignore` entry:**
- Add `coverage/` directory to `.gitignore`

**Update `package.json` scripts:**
- Ensure `test:coverage` script generates coverage report
- Add `test:coverage:open` script to open HTML coverage report in browser

### 8. Set Up Test Execution and CI Integration

**Update `package.json` test scripts:**
- `test`: Run all tests once
- `test:watch`: Run tests in watch mode during development
- `test:unit`: Run only unit tests (`vitest run tests/unit`)
- `test:coverage`: Run tests with coverage report
- `pretest`: Compile TypeScript before running tests

**Create `.vscode/settings.json` (if not exists):**
- Configure Vitest extension settings for VS Code
- Enable test explorer integration
- Set up test debugging configuration

**Prepare for CI integration (for future phase):**
- Ensure tests run in headless mode
- Ensure tests don't require VS Code API (mock it)
- Ensure tests are deterministic (no flaky tests)

### 9. Write Additional Test Utilities

**Create `tests/utils/testHelpers.ts`:**
- `withTempDirectory()` - Create temporary directory for file system tests
- `cleanupTempFiles()` - Clean up temporary files after tests
- `mockVSCodeAPI()` - Comprehensive VS Code API mock
- `waitFor()` - Async helper for waiting on conditions
- `flushPromises()` - Flush pending promises in tests

**Create `tests/utils/matchers.ts`:**
- Custom Vitest matchers for domain-specific assertions
- `toBeValidSpec()` - Assert object is valid Spec
- `toBeValidTicket()` - Assert object is valid Ticket
- `toHaveValidFrontmatter()` - Assert markdown has valid YAML frontmatter
- `toMatchSpecRequirement()` - Assert code change matches spec requirement

### 10. Documentation and Best Practices

**Create `tests/README.md`:**
- Document test organization structure
- Explain how to run tests (unit, integration, coverage)
- Provide examples of writing new tests
- Document mocking patterns and utilities
- Explain coverage requirements and how to improve coverage

**Add JSDoc comments to test utilities:**
- Document purpose and usage of each mock factory
- Document parameters and return types
- Provide usage examples

**Establish testing conventions:**
- Use `describe` blocks to group related tests
- Use descriptive test names: "should [expected behavior] when [condition]"
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies (file system, LLM, VS Code API)
- Use fixtures for test data
- Clean up resources in `afterEach` hooks