import { DiffAdapter, DiffFormat } from '../types';
import { GitDiffAdapter } from './GitDiffAdapter';
import { GitHubAdapter } from './GitHubAdapter';
import { GitLabAdapter } from './GitLabAdapter';

export { GitDiffAdapter, GitHubAdapter, GitLabAdapter };

export function createAdapter(format: DiffFormat): DiffAdapter {
  switch (format) {
    case 'git':
      return new GitDiffAdapter();
    case 'github':
      return new GitHubAdapter();
    case 'gitlab':
      return new GitLabAdapter();
    case 'unified':
      return new GitDiffAdapter();
    default:
      throw new Error(`Unknown diff format: ${format}`);
  }
}

export function detectFormatFromInput(input: string): DiffFormat {
  if (input.trim().startsWith('diff --git')) {
    return 'git';
  }
  
  if (input.includes('github.com') && input.includes('/pull/')) {
    return 'github';
  }
  
  if (input.includes('gitlab.com') && input.includes('/merge_requests/')) {
    return 'gitlab';
  }
  
  if (input.trim().startsWith('{') || input.trim().startsWith('[')) {
    try {
      const data = JSON.parse(input);
      if (Array.isArray(data) && data[0]?.filename) {
        return 'github';
      }
      if (data.changes && Array.isArray(data.changes)) {
        return 'gitlab';
      }
    } catch {
      return 'unified';
    }
  }

  return 'unified';
}
