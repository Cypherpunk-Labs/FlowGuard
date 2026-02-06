import * as assert from 'assert';
import * as path from 'path';
import { VerificationEngine } from '../../../src/verification/VerificationEngine';
import { DiffAnalyzer } from '../../../src/verification/DiffAnalyzer';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { GitHelper } from '../../../src/core/git/GitHelper';
import { ReferenceResolver } from '../../../src/core/references/ReferenceResolver';
import { CodebaseExplorer } from '../../../src/planning/codebase/CodebaseExplorer';
import { createMockLLMProvider } from '../../utils/mocks';
import { VerificationInput } from '../../../src/verification/types';

suite('Verification Workflow Integration Tests', () => {
  let engine: VerificationEngine;
  let storage: ArtifactStorage;
  let gitHelper: GitHelper;
  let analyzer: DiffAnalyzer;
  let mockProvider: ReturnType<typeof createMockLLMProvider>;
  const testWorkspacePath = path.resolve(__dirname, '../../../test-workspace');

  setup(async () => {
    mockProvider = createMockLLMProvider();
    storage = new ArtifactStorage(testWorkspacePath);
    gitHelper = new GitHelper(testWorkspacePath);
    const codebaseExplorer = new CodebaseExplorer(testWorkspacePath);
    const referenceResolver = new ReferenceResolver(storage, testWorkspacePath);
    
    await storage.initialize();
    
    engine = new VerificationEngine(
      mockProvider,
      storage,
      gitHelper,
      referenceResolver,
      codebaseExplorer
    );
    
    analyzer = new DiffAnalyzer();
  });

  test('should complete verification workflow successfully', async function() {
    this.timeout(30000);
    
    const diffText = `diff --git a/src/test.ts b/src/test.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/test.ts
@@ -0,0 +1,5 @@
+export function test() {
+  return true;
+}
`;

    const input: VerificationInput = {
      epicId: 'test-epic',
      specIds: ['spec-sample'],
      diffInput: {
        format: 'git',
        content: diffText,
        metadata: {
          commitHash: 'abc123',
          branch: 'feature-branch',
          author: 'Test User',
          message: 'Add test function'
        }
      }
    };

    const result = await engine.verifyChanges(input);

    assert.ok(result.id, 'Result should have id');
    assert.strictEqual(result.epicId, 'test-epic');
    assert.ok(result.diffSource, 'Result should have diffSource');
    assert.ok(result.analysis, 'Result should have analysis');
    assert.ok(result.issues, 'Result should have issues');
    assert.ok(result.summary, 'Result should have summary');
    assert.ok(result.createdAt, 'Result should have createdAt');
  });

  test('should parse diff and extract changes', () => {
    const diffText = `diff --git a/src/test.ts b/src/test.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/test.ts
@@ -0,0 +1,3 @@
+line 1
+line 2
+line 3
`;

    const result = analyzer.parseDiff(diffText, 'git');

    assert.strictEqual(result.totalFiles, 1);
    assert.strictEqual(result.additions, 3);
    assert.strictEqual(result.deletions, 0);
    assert.strictEqual(result.changedFiles.length, 1);
  });

  test('should persist verification record to storage', async function() {
    this.timeout(30000);
    
    const diffText = `diff --git a/src/test.ts b/src/test.ts
--- a/src/test.ts
+++ b/src/test.ts
@@ -1 +1 @@
-old
+new
`;

    const input: VerificationInput = {
      epicId: 'test-epic',
      specIds: ['spec-sample'],
      diffInput: {
        format: 'git',
        content: diffText
      }
    };

    const result = await engine.verifyChanges(input);
    
    const verifications = await storage.listVerifications('test-epic');
    const savedVerification = verifications.find(v => v.id === result.id);
    
    assert.ok(savedVerification, 'Verification should be saved to storage');
    assert.strictEqual(savedVerification.epicId, 'test-epic');
  });

  test('should categorize issues by severity', async function() {
    this.timeout(30000);
    
    const diffText = `diff --git a/src/test.ts b/src/test.ts
--- a/src/test.ts
+++ b/src/test.ts
@@ -1 +1 @@
-old
+new
`;

    const input: VerificationInput = {
      epicId: 'test-epic',
      specIds: ['spec-sample'],
      diffInput: {
        format: 'git',
        content: diffText
      }
    };

    const result = await engine.verifyChanges(input);
    
    const severities = ['Critical', 'High', 'Medium', 'Low'];
    for (const issue of result.issues) {
      assert.ok(
        severities.includes(issue.severity),
        `Issue severity ${issue.severity} should be valid`
      );
    }
  });

  test('should handle verification without spec IDs', async function() {
    this.timeout(30000);
    
    const diffText = `diff --git a/src/test.ts b/src/test.ts
--- a/src/test.ts
+++ b/src/test.ts
@@ -1 +1 @@
-old
+new
`;

    const input: VerificationInput = {
      epicId: 'test-epic',
      diffInput: {
        format: 'git',
        content: diffText
      }
    };

    const result = await engine.verifyChanges(input);

    assert.ok(result.id, 'Should still generate verification without specs');
    assert.ok(result.issues, 'Should have issues array');
    assert.ok(result.summary, 'Should have summary');
  });
});
