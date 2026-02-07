import { describe, it, expect, beforeEach } from '@jest/globals';
import { GitLabAdapter } from '@/verification/adapters/GitLabAdapter';

describe('GitLabAdapter', () => {
  let adapter: GitLabAdapter;

  beforeEach(() => {
    adapter = new GitLabAdapter();
  });

  describe('parseMRUrl', () => {
    it('should parse standard MR URL with /-/ format', () => {
      const url = 'https://gitlab.com/owner/project/-/merge_requests/123';
      const result = (adapter as any).parseMRUrl(url);

      expect(result).toEqual({
        projectId: 'owner/project',
        mrId: '123'
      });
    });

    it('should parse MR URL with /-/ format', () => {
      const url = 'https://gitlab.com/owner/project/-/merge_requests/456';
      const result = (adapter as any).parseMRUrl(url);

      expect(result).toEqual({
        projectId: 'owner/project',
        mrId: '456'
      });
    });

    it('should parse standard MR URL format', () => {
      const url = 'https://gitlab.com/owner/project/-/merge_requests/789';
      const result = (adapter as any).parseMRUrl(url);

      expect(result).toEqual({
        projectId: 'owner/project',
        mrId: '789'
      });
    });

    it('should return null for invalid URLs', () => {
      expect((adapter as any).parseMRUrl('https://google.com')).toBeNull();
      expect((adapter as any).parseMRUrl('https://gitlab.com/owner/project/issues/123')).toBeNull();
    });
  });

  describe('adapt', () => {
    it('should throw error for invalid MR URL', async () => {
      await expect(adapter.adapt('https://invalid.com/mr/123')).rejects.toThrow('Invalid GitLab MR URL');
    });

    it('should return DiffInput for valid MR URL with mocked fetch', async () => {
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
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
        })
      } as Response);

      const result = await adapter.adapt('https://gitlab.com/owner/project/-/merge_requests/123');

      expect(result.format).toBe('gitlab');
      expect(result.content).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.prUrl).toBe('https://gitlab.com/owner/project/-/merge_requests/123');

      mockFetch.mockRestore();
    });

    it('should handle renamed files in MR', async () => {
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          changes: [
            {
              old_path: 'src/old-name.ts',
              new_path: 'src/new-name.ts',
              new_file: false,
              deleted_file: false,
              renamed_file: true,
              diff: ''
            }
          ]
        })
      } as Response);

      const result = await adapter.adapt('https://gitlab.com/owner/project/-/merge_requests/123');

      expect(result.format).toBe('gitlab');

      mockFetch.mockRestore();
    });

    it('should handle fetch errors gracefully', async () => {
      const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      await expect(adapter.adapt('https://gitlab.com/owner/project/-/merge_requests/123')).rejects.toThrow('GitLab API error');

      mockFetch.mockRestore();
    });
  });
});
