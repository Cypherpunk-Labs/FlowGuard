I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Integration/perf test scripts reference out/ paths and JS globs that are never built, so no tests will run

Add a build step for integration/performance tests (e.g., `tsc -p tests/tsconfig.json` emitting to `out/tests`) or switch the runner to use `ts-node/register`. Update `tests/integration/index.ts` to include `.test.ts` (or compiled `.js` if you build). Change `npm run test:integration` and `npm run test:performance` to point at the actual built or TS entrypoints so the commands execute.

### Referred Files
- {WORKSPACE}/tests/integration/runTest.ts
- {WORKSPACE}/tests/integration/index.ts
- {WORKSPACE}/tests/performance/runBenchmarks.ts
- {WORKSPACE}/package.json
---
## Comment 2: Required test workspace fixtures are missing, causing integration/E2E/perf tests to fail on filesystem access

Create a `test-workspace` folder at the repo root with the expected `.flowguard/` structure (epic.json, specs/, tickets/, executions/, verifications/, templates/) and sample `src/` files. Commit these fixtures or adjust tests to generate them in setup before use.

### Referred Files
- {WORKSPACE}/tests/integration/runTest.ts
- {WORKSPACE}/tests/integration/workflows/epicCreation.test.ts
- {WORKSPACE}/tests/e2e/fixtures/workspace.ts
- {WORKSPACE}/tests/performance/activation.test.ts
- {WORKSPACE}/tests/performance/benchmark.ts
---
## Comment 3: Playwright E2E driver never launches VS Code or opens the test workspace, so E2E flows can’t run

Use an approach that actually launches VS Code with the extension (e.g., spawn `code` with `--extensionDevelopmentPath` and `--extensionTestsPath`, or leverage `@vscode/test-electron` with Playwright connecting to the Electron instance). Ensure the created workspace path is opened before running commands. Replace the `vscode://` navigation with a real VS Code launch/attach flow and wire the driver to the workbench DOM of that instance.

### Referred Files
- {WORKSPACE}/tests/e2e/utils/vscodeDriver.ts
- {WORKSPACE}/tests/e2e/onboarding.test.ts
- {WORKSPACE}/tests/e2e/developmentCycle.test.ts
---
## Comment 4: Performance benchmarks import VS Code APIs in plain Node and ignore requested file counts

Run performance benchmarks inside an extension host (reuse `@vscode/test-electron` launch) so `vscode` is available. Generate the requested number of files in a temp workspace before scanning and pass that workspace to `FileScanner`. Use the `fileCount` argument to control workload and assert against the correct target. Update the script entry so the runnable build matches the configured path.

### Referred Files
- {WORKSPACE}/tests/performance/benchmark.ts
- {WORKSPACE}/tests/performance/activation.test.ts
- {WORKSPACE}/tests/performance/runBenchmarks.ts
- {WORKSPACE}/package.json
---