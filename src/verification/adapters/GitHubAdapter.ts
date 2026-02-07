import { DiffAdapter, DiffInput } from '../types';

export class GitHubAdapter implements DiffAdapter {
  async adapt(prUrl: string, apiToken?: string): Promise<DiffInput> {
    const prInfo = this.parsePRUrl(prUrl);
    
    if (!prInfo) {
      throw new Error(`Invalid GitHub PR URL: ${prUrl}`);
    }

    const { owner, repo, pullNumber } = prInfo;

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
      };
      
      if (apiToken) {
        headers['Authorization'] = `token ${apiToken}`;
      }

      const filesResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
        { headers }
      );

      if (!filesResponse.ok) {
        throw new Error(`GitHub API error: ${filesResponse.status} ${filesResponse.statusText}`);
      }

      const files = await filesResponse.json();

      const prResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
        { headers }
      );

      if (!prResponse.ok) {
        throw new Error(`GitHub API error: ${prResponse.status} ${prResponse.statusText}`);
      }

      const prData = await prResponse.json() as {
        head?: { sha?: string; ref?: string };
        user?: { login?: string };
        created_at?: string;
        title?: string;
      };

      return {
        format: 'github',
        content: JSON.stringify(files),
        metadata: {
          prUrl,
          commitHash: prData.head?.sha,
          branch: prData.head?.ref,
          author: prData.user?.login,
          timestamp: prData.created_at ? new Date(prData.created_at) : undefined,
          message: prData.title
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch GitHub PR: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parsePRUrl(url: string): { owner: string; repo: string; pullNumber: string } | null {
    const patterns = [
      /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/,
      /github\.com\/([^\/]+)\/([^\/]+)\/pulls\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[2] && match[3]) {
        return {
          owner: match[1],
          repo: match[2],
          pullNumber: match[3]
        };
      }
    }

    return null;
  }
}
