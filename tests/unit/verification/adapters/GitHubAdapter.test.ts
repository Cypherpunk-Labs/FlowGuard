import { describe, it, expect, beforeEach } from '@jest/globals';
import { GitHubAdapter } from '@/verification/adapters/GitHubAdapter';

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;

  beforeEach(() => {
    adapter = new GitHubAdapter();
  });

  describe('parsePRUrl', () => {
    it('should parse standard PR URL format', () => {
      const url = 'https://github.com/owner/repo/pull/123';
      const result = (adapter as any).parsePRUrl(url);

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        pullNumber: '123'
      });
    });

    it('should parse PR URL with /pulls/ format', () => {
      const url = 'https://github.com/owner/repo/pulls/456';
      const result = (adapter as any).parsePRUrl(url);

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        pullNumber: '456'
      });
    });

    it('should handle standard github.com URLs', () => {
      const url = 'https://github.com/microsoft/vscode/pull/12345';
      const result = (adapter as any).parsePRUrl(url);

      expect(result).toEqual({
        owner: 'microsoft',
        repo: 'vscode',
        pullNumber: '12345'
      });
    });

    it('should return null for invalid URLs', () => {
      expect((adapter as any).parsePRUrl('https://google.com')).toBeNull();
      expect((adapter as any).parsePRUrl('https://github.com/owner/repo/issues/123')).toBeNull();
    });
  });

  describe('adapt', () => {
    it('should throw error for invalid PR URL', async () => {
      await expect(adapter.adapt('https://invalid.com/pr/123')).rejects.toThrow('Invalid GitHub PR URL');
    });

    it('should return DiffInput for valid PR URL with mocked fetch', async () => {
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([
          {
            filename: 'src/test.ts',
            status: 'modified',
            additions: 10,
            deletions: 5,
            patch: '@@ -1,5 +1,10 @@\n+line 1\n+line 2'
          }
        ])
      } as Response);

      const result = await adapter.adapt('https://github.com/owner/repo/pull/123');

      expect(result.format).toBe('github');
      expect(result.content).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.prUrl).toBe('https://github.com/owner/repo/pull/123');

      mockFetch.mockRestore();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(adapter.adapt('https://github.com/owner/repo/pull/123')).rejects.toThrow('GitHub API error');

      mockFetch.mockRestore();
    });
  });
});
