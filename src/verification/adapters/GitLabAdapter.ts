import { DiffAdapter, DiffInput } from '../types';

export class GitLabAdapter implements DiffAdapter {
  async adapt(mrUrl: string, apiToken?: string): Promise<DiffInput> {
    const mrInfo = this.parseMRUrl(mrUrl);
    
    if (!mrInfo) {
      throw new Error(`Invalid GitLab MR URL: ${mrUrl}`);
    }

    const { projectId, mrId } = mrInfo;

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };
      
      if (apiToken) {
        headers['Private-Token'] = apiToken;
      }

      const changesResponse = await fetch(
        `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/merge_requests/${mrId}/changes`,
        { headers }
      );

      if (!changesResponse.ok) {
        throw new Error(`GitLab API error: ${changesResponse.status} ${changesResponse.statusText}`);
      }

      const changesData = await changesResponse.json();

      const mrResponse = await fetch(
        `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectId)}/merge_requests/${mrId}`,
        { headers }
      );

      if (!mrResponse.ok) {
        throw new Error(`GitLab API error: ${mrResponse.status} ${mrResponse.statusText}`);
      }

      const mrData = await mrResponse.json() as {
        sha?: string;
        source_branch?: string;
        author?: { username?: string };
        created_at?: string;
        title?: string;
      };

      return {
        format: 'gitlab',
        content: JSON.stringify(changesData),
        metadata: {
          prUrl: mrUrl,
          commitHash: mrData.sha,
          branch: mrData.source_branch,
          author: mrData.author?.username,
          timestamp: mrData.created_at ? new Date(mrData.created_at) : undefined,
          message: mrData.title
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch GitLab MR: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseMRUrl(url: string): { projectId: string; mrId: string } | null {
    const patterns = [
      /gitlab\.com\/([^\/]+\/[^\/]+)\/-\/merge_requests\/(\d+)/,
      /gitlab\.com\/([^\/]+)\/([^\/]+)\/merge_requests\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[2]) {
        return {
          projectId: match[1],
          mrId: match[2]
        };
      }
    }

    const alternatePattern = /gitlab\.com\/([^/]+)\/([^/]+)\/-\/merge_requests\/(\d+)/;
    const altMatch = url.match(alternatePattern);
    if (altMatch && altMatch[1] && altMatch[2] && altMatch[3]) {
      return {
        projectId: `${altMatch[1]}/${altMatch[2]}`,
        mrId: altMatch[3]
      };
    }

    return null;
  }
}
