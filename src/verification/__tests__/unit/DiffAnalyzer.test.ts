import { describe, it, expect, beforeEach } from 'vitest';
import { DiffAnalyzer } from '../../DiffAnalyzer';

describe('DiffAnalyzer', () => {
  let analyzer: DiffAnalyzer;

  beforeEach(() => {
    analyzer = new DiffAnalyzer();
  });

  describe('parseDiff - git format', () => {
    it('should parse a simple git diff', () => {
      const diffText = `diff --git a/src/test.ts b/src/test.ts
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

      const result = analyzer.parseDiff(diffText, 'git');

      expect(result.totalFiles).toBe(1);
      expect(result.additions).toBe(5);
      expect(result.deletions).toBe(0);
      expect(result.changedFiles.length).toBeGreaterThan(0);
      expect(result.changedFiles[0]?.path).toBe('src/test.ts');
      expect(result.changedFiles[0]?.status).toBe('added');
    });

    it('should parse a modified file diff', () => {
      const diffText = `diff --git a/src/example.ts b/src/example.ts
index 1234567..abcdefg 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -1,5 +1,5 @@
 export function example() {
-  return false;
+  return true;
 }
 
 export default example;
`;

      const result = analyzer.parseDiff(diffText, 'git');

      expect(result.totalFiles).toBe(1);
      expect(result.additions).toBe(1);
      expect(result.deletions).toBe(1);
      expect(result.changedFiles.length).toBeGreaterThan(0);
      expect(result.changedFiles[0]?.status).toBe('modified');
    });

    it('should parse a deleted file diff', () => {
      const diffText = `diff --git a/src/old.ts b/src/old.ts
deleted file mode 100644
index 1234567..0000000
--- a/src/old.ts
+++ /dev/null
@@ -1,3 +0,0 @@
-export function old() {
-  return 'old';
-}
`;

      const result = analyzer.parseDiff(diffText, 'git');

      expect(result.totalFiles).toBe(1);
      expect(result.deletions).toBe(3);
      expect(result.additions).toBe(0);
      expect(result.changedFiles.length).toBeGreaterThan(0);
      expect(result.changedFiles[0]?.status).toBe('deleted');
    });

    it('should parse a renamed file diff', () => {
      const diffText = `diff --git a/src/old.ts b/src/new.ts
similarity index 100%
rename from src/old.ts
rename to src/new.ts
`;

      const result = analyzer.parseDiff(diffText, 'git');

      expect(result.totalFiles).toBe(1);
      expect(result.changedFiles.length).toBeGreaterThan(0);
      expect(result.changedFiles[0]?.path).toBe('src/new.ts');
    });

    it('should handle multiple files in one diff', () => {
      const diffText = `diff --git a/src/file1.ts b/src/file1.ts
index 123..456 100644
--- a/src/file1.ts
+++ b/src/file1.ts
@@ -1 +1 @@
-old content
+new content

diff --git a/src/file2.ts b/src/file2.ts
index 789..abc 100644
--- a/src/file2.ts
+++ b/src/file2.ts
@@ -1 +1 @@
-foo
+bar
`;

      const result = analyzer.parseDiff(diffText, 'git');

      expect(result.totalFiles).toBe(2);
      expect(result.changedFiles.length).toBe(2);
    });

    it('should handle empty diff', () => {
      const result = analyzer.parseDiff('', 'git');

      expect(result.totalFiles).toBe(0);
      expect(result.additions).toBe(0);
      expect(result.deletions).toBe(0);
    });

    it('should calculate statistics correctly', () => {
      const diffText = `diff --git a/src/test.ts b/src/test.ts
index 123..456 100644
--- a/src/test.ts
+++ b/src/test.ts
@@ -1,5 +1,6 @@
 line 1
-line 2
+new line 2
+extra line
 line 3
 line 4
 line 5
`;

      const result = analyzer.parseDiff(diffText, 'git');

      expect(result.totalFiles).toBe(1);
      expect(result.additions).toBe(2);
      expect(result.deletions).toBe(1);
      expect(result.totalLines).toBe(3);
    });
  });

  describe('parseDiff - GitHub format', () => {
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
        },
        {
          filename: 'src/example.ts',
          status: 'modified',
          additions: 1,
          deletions: 1,
          patch: `@@ -1,5 +1,5 @@
 export function example() {
-  return false;
+  return true;
 }`
        }
      ]);

      const result = analyzer.parseDiff(githubDiff, 'github');

      expect(result.totalFiles).toBe(2);
      expect(result.changedFiles.length).toBe(2);
      expect(result.changedFiles[0]?.path).toBe('src/test.ts');
      expect(result.changedFiles[1]?.path).toBe('src/example.ts');
    });

    it('should handle empty GitHub diff', () => {
      const result = analyzer.parseDiff('[]', 'github');

      expect(result.totalFiles).toBe(0);
    });
  });

  describe('parseDiff - GitLab format', () => {
    it('should parse GitLab MR diff JSON', () => {
      const gitlabDiff = JSON.stringify({
        changes: [
          {
            old_path: 'src/old.ts',
            new_path: 'src/new.ts',
            new_file: false,
            deleted_file: false,
            renamed_file: true,
            diff: '@@ -1,3 +1,3 @@\n-old\n+new'
          },
          {
            old_path: 'src/test.ts',
            new_path: 'src/test.ts',
            new_file: true,
            deleted_file: false,
            renamed_file: false,
            diff: '@@ -0,0 +1,5 @@\n+line 1\n+line 2'
          }
        ]
      });

      const result = analyzer.parseDiff(gitlabDiff, 'gitlab');

      expect(result.totalFiles).toBe(2);
      expect(result.changedFiles.length).toBe(2);
    });
  });

  describe('detectFormat', () => {
    it('should detect git format', () => {
      const diff = 'diff --git a/test.ts b/test.ts\nindex 123..456';
      expect(analyzer.detectFormat(diff)).toBe('git');
    });

    it('should detect unified format', () => {
      const diff = '@@ -1,5 +1,5 @@\n-old\n+new';
      expect(analyzer.detectFormat(diff)).toBe('unified');
    });

    it('should detect GitHub format from JSON', () => {
      const diff = '[{"filename": "test.ts"}]';
      expect(analyzer.detectFormat(diff)).toBe('github');
    });

    it('should detect GitLab format from JSON', () => {
      const diff = '{"changes": [{"new_path": "test.ts"}]}';
      expect(analyzer.detectFormat(diff)).toBe('gitlab');
    });
  });

  describe('extractMetadata', () => {
    it('should extract metadata from git email format', () => {
      const diffText = `From 1234567890abcdef1234567890abcdef12345678 Mon Sep 17 00:00:00 2001
From: John Doe <john@example.com>
Subject: [PATCH] Fix bug in parser

diff --git a/src/parser.ts b/src/parser.ts
`;

      const metadata = analyzer.extractMetadata(diffText, 'git');

      expect(metadata.commitHash).toBe('1234567890abcdef1234567890abcdef12345678');
      expect(metadata.author).toBe('John Doe <john@example.com>');
      expect(metadata.message).toBe('Fix bug in parser');
    });

    it('should return empty object for non-git format', () => {
      const metadata = analyzer.extractMetadata('some content', 'unified');
      expect(Object.keys(metadata).length).toBe(0);
    });
  });
});
