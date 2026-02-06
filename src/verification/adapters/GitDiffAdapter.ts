import { DiffAdapter } from '../types';
import { DiffInput } from '../types';

export class GitDiffAdapter implements DiffAdapter {
  adapt(input: string): DiffInput {
    const metadata = this.extractMetadata(input);
    
    return {
      format: 'git',
      content: input,
      metadata: {
        commitHash: metadata.commitHash,
        author: metadata.author,
        branch: metadata.branch,
        message: metadata.message
      }
    };
  }

  private extractMetadata(diffText: string): {
    commitHash?: string;
    author?: string;
    branch?: string;
    message?: string;
  } {
    const metadata: {
      commitHash?: string;
      author?: string;
      branch?: string;
      message?: string;
    } = {};

    const commitMatch = diffText.match(/^From ([a-f0-9]{40})/m);
    if (commitMatch) {
      metadata.commitHash = commitMatch[1];
    }

    const authorMatch = diffText.match(/^From: (.+) <(.+)>/m);
    if (authorMatch && authorMatch[1] && authorMatch[2]) {
      metadata.author = `${authorMatch[1]} <${authorMatch[2]}>`;
    }

    const subjectMatch = diffText.match(/^Subject: \[PATCH\]?\s*(.+)$/m);
    if (subjectMatch) {
      metadata.message = subjectMatch[1];
    }

    const branchMatch = diffText.match(/diff --git .*\.\.\.\s*(.+)/);
    if (branchMatch && branchMatch[1]) {
      metadata.branch = branchMatch[1].trim();
    }

    return metadata;
  }
}
