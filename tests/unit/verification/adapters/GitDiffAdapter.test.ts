import { describe, it, expect, beforeEach } from '@jest/globals';
import { GitDiffAdapter } from '../../../src/verification/adapters/GitDiffAdapter';
import { DiffInput } from '../../../src/verification/types';

describe('GitDiffAdapter', () => {
  let adapter: GitDiffAdapter;

  beforeEach(() => {
    adapter = new GitDiffAdapter();
  });

  describe('adapt', () => {
    it('should parse standard git diff format', () => {
      const diffInput = `diff --git a/src/test.ts b/src/test.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/src/test.ts
@@ -0,0 +1,5 @@
+export function test() {
+  return true;
+}
+
+export default test;
`;

      const result = adapter.adapt(diffInput);

      expect(result.format).toBe('git');
      expect(result.content).toBe(diffInput);
    });

    it('should handle renamed files', () => {
      const diffInput = `diff --git a/src/old.ts b/src/new.ts
similarity index 100%
rename from src/old.ts
rename to src/new.ts
`;

      const result = adapter.adapt(diffInput);

      expect(result.format).toBe('git');
      expect(result.content).toContain('rename from');
    });

    it('should handle modified files', () => {
      const diffInput = `diff --git a/src/test.ts b/src/test.ts
index 123..456 100644
--- a/src/test.ts
+++ b/src/test.ts
@@ -1,3 +1,3 @@
-old line
+new line
`;

      const result = adapter.adapt(diffInput);

      expect(result.format).toBe('git');
    });

    it('should handle deleted files', () => {
      const diffInput = `diff --git a/src/old.ts b/src/old.ts
deleted file mode 100644
index 123..456 100644
--- a/src/old.ts
+++ /dev/null
@@ -1,0 +0,0 @@
`;

      const result = adapter.adapt(diffInput);

      expect(result.format).toBe('git');
      expect(result.content).toContain('deleted file');
    });

    it('should handle empty diff', () => {
      const result = adapter.adapt('');

      expect(result.format).toBe('git');
      expect(result.content).toBe('');
    });

    it('should include metadata when provided', () => {
      const diffInput = `diff --git a/src/test.ts b/src/test.ts
index 123..456 100644
--- a/src/test.ts
+++ b/src/test.ts
@@ -1 +1 @@
-old
+new
`;

      const inputWithMetadata: DiffInput = {
        format: 'git',
        content: diffInput,
        metadata: {
          commitHash: 'abc123',
          branch: 'main',
          author: 'Test User',
          message: 'Test commit'
        }
      };

      const result = adapter.adapt(inputWithMetadata.content, inputWithMetadata.metadata);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.commitHash).toBe('abc123');
    });
  });

  describe('parseFilePath', () => {
    it('should extract new file path', () => {
      const diffInput = `diff --git a/src/new.ts b/src/new.ts
new file mode 100644
--- /dev/null
+++ b/src/new.ts
`;

      const result = adapter.adapt(diffInput);

      expect(result.content).toContain('src/new.ts');
    });

    it('should handle paths with spaces', () => {
      const diffInput = `diff --git "a/src/file with spaces.ts" "b/src/file with spaces.ts"
--- /dev/null
+++ "b/src/file with spaces.ts"
@@ -0,0 +1 @@
+content
`;

      const result = adapter.adapt(diffInput);

      expect(result.content).toContain('file with spaces');
    });
  });

  describe('parseHunkHeader', () => {
    it('should parse hunk headers correctly', () => {
      const diffInput = `diff --git a/src/test.ts b/src/test.ts
@@ -1,3 +1,4 @@
 context
-old line
+new line
+added line
`;

      const result = adapter.adapt(diffInput);

      expect(result.format).toBe('git');
    });

    it('should handle multiple hunks', () => {
      const diffInput = `diff --git a/src/test.ts b/src/test.ts
@@ -1,2 +1,2 @@
 first
-old
+new
@@ -5,3 +5,4 @@
 fifth
-change
+changed
+addition
`;

      const result = adapter.adapt(diffInput);

      expect(result.format).toBe('git');
    });
  });
});

describe('GitHubAdapter', () => {
  let adapter: { adapt: (input: string) => DiffInput };

  beforeEach(() => {
    const GitHubAdapter = require('../../../src/verification/adapters/GitHubAdapter').GitHubAdapter;
    adapter = new GitHubAdapter();
  });

  describe('adapt', () => {
    it('should parse GitHub PR diff JSON', () => {
      const githubDiff = JSON.stringify([
        {
          filename: 'src/test.ts',
          status: 'added',
          additions: 10,
          deletions: 0,
          patch: `@@ -0,0 +1,10 @@
+export function test() {
+  return true;
+}`
        }
      ]);

      const result = adapter.adapt(githubDiff);

      expect(result.format).toBe('github');
      expect(result.content).toContain('src/test.ts');
    });

    it('should handle empty PR diff', () => {
      const result = adapter.adapt('[]');

      expect(result.format).toBe('github');
      expect(result.content).toBe('[]');
    });

    it('should include PR metadata', () => {
      const githubDiff = JSON.stringify([
        { filename: 'test.ts', status: 'modified', additions: 1, deletions: 1 }
      ]);

      const result = adapter.adapt(githubDiff, {
        prUrl: 'https://github.com/user/repo/pull/1',
        commitHash: 'abc123',
        branch: 'feature-branch',
        author: 'test-user'
      });

      expect(result.metadata?.prUrl).toBe('https://github.com/user/repo/pull/1');
    });
  });
});

describe('GitLabAdapter', () => {
  let adapter: { adapt: (input: string) => DiffInput };

  beforeEach(() => {
    const GitLabAdapter = require('../../../src/verification/adapters/GitLabAdapter').GitLabAdapter;
    adapter = new GitLabAdapter();
  });

  describe('adapt', () => {
    it('should parse GitLab MR diff JSON', () => {
      const gitlabDiff = JSON.stringify({
        changes: [
          {
            old_path: 'src/old.ts',
            new_path: 'src/new.ts',
            new_file: true,
            deleted_file: false,
            renamed_file: false,
            diff: '@@ -0,0 +1,5 @@\n+line 1\n+line 2'
          }
        ]
      });

      const result = adapter.adapt(gitlabDiff);

      expect(result.format).toBe('gitlab');
      expect(result.content).toContain('src/new.ts');
    });

    it('should handle empty MR diff', () => {
      const result = adapter.adapt('{"changes":[]}');

      expect(result.format).toBe('gitlab');
      expect(result.content).toContain('changes');
    });

    it('should include MR metadata', () => {
      const gitlabDiff = JSON.stringify({ changes: [] });

      const result = adapter.adapt(gitlabDiff, {
        commitHash: 'abc123',
        branch: 'feature-branch',
        author: 'test-user',
        message: 'Test MR'
      });

      expect(result.metadata?.commitHash).toBe('abc123');
    });

    it('should handle renamed files', () => {
      const gitlabDiff = JSON.stringify({
        changes: [
          {
            old_path: 'src/old.ts',
            new_path: 'src/new.ts',
            new_file: false,
            deleted_file: false,
            renamed_file: true,
            diff: ''
          }
        ]
      });

      const result = adapter.adapt(gitlabDiff);

      expect(result.format).toBe('gitlab');
    });
  });
});
