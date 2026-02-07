import * as vscode from 'vscode';
import { CommandContext } from './types';

export async function verifyChangesCommand(context: CommandContext): Promise<void> {
  try {
    const inputOptions = await vscode.window.showQuickPick(
      [
        { label: '$(git-diff) Git Diff', description: 'Use uncommitted changes', value: 'git' },
        { label: '$(github) GitHub PR URL', description: 'Verify a GitHub pull request', value: 'github' },
        { label: '$(gitlab) GitLab MR URL', description: 'Verify a GitLab merge request', value: 'gitlab' },
        { label: '$(clippy) Manual Paste', description: 'Paste diff manually', value: 'manual' },
      ],
      {
        placeHolder: 'Select diff input method',
      }
    );

    if (!inputOptions) {
      return;
    }

    let diffContent = '';
    let metadata: { commitHash?: string; branch?: string; author?: string; message?: string } = {};

    switch (inputOptions.value) {
      case 'git':
        diffContent = await context.gitHelper.getDiff();
        if (!diffContent) {
          vscode.window.showInformationMessage('No uncommitted changes found.');
          return;
        }
        metadata.branch = await context.gitHelper.getCurrentBranch();
        break;

      case 'github':
        const prUrl = await vscode.window.showInputBox({
          prompt: 'Enter GitHub PR URL',
          placeHolder: 'https://github.com/owner/repo/pull/123',
          validateInput: (value) => {
            if (!value || !value.includes('github.com')) {
              return 'Please enter a valid GitHub URL';
            }
            return null;
          },
        });
        if (!prUrl) {
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Fetching GitHub PR',
            cancellable: false,
          },
          async () => {
            try {
              const { GitHubAdapter } = await import('../verification/adapters');
              const adapter = new GitHubAdapter();
              const diffInput = await adapter.adapt(prUrl);
              diffContent = diffInput.content;
              metadata = diffInput.metadata || {};
            } catch (error) {
              throw new Error(`Failed to fetch GitHub PR: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        );
        break;

      case 'gitlab':
        const mrUrl = await vscode.window.showInputBox({
          prompt: 'Enter GitLab MR URL',
          placeHolder: 'https://gitlab.com/owner/repo/-/merge_requests/123',
          validateInput: (value) => {
            if (!value || !value.includes('gitlab.com')) {
              return 'Please enter a valid GitLab URL';
            }
            return null;
          },
        });
        if (!mrUrl) {
          return;
        }

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Fetching GitLab MR',
            cancellable: false,
          },
          async () => {
            try {
              const { GitLabAdapter } = await import('../verification/adapters');
              const adapter = new GitLabAdapter();
              const diffInput = await adapter.adapt(mrUrl);
              diffContent = diffInput.content;
              metadata = diffInput.metadata || {};
            } catch (error) {
              throw new Error(`Failed to fetch GitLab MR: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        );
        break;

      case 'manual':
        const manualInput = await vscode.window.showInputBox({
          prompt: 'Paste your diff',
          placeHolder: 'Paste git diff or code changes here...',
          validateInput: (value) => {
            if (!value || value.length < 10) {
              return 'Please paste a valid diff';
            }
            return null;
          },
        });
        if (!manualInput) {
          return;
        }
        diffContent = manualInput;
        metadata.message = 'Manual paste';
        break;

      default:
        return;
    }

    if (!diffContent) {
      vscode.window.showErrorMessage('Failed to get diff content');
      return;
    }

    const specs = await context.storage.listSpecs();
    if (specs.length === 0) {
      vscode.window.showInformationMessage('No specs found to verify against.');
      return;
    }

    const specItems = specs.map((spec) => ({
      label: spec.title,
      description: `Status: ${spec.status}`,
      id: spec.id,
    }));

    const selectedSpecs = await vscode.window.showQuickPick(specItems, {
      placeHolder: 'Select specs to verify against (you can select multiple)',
      canPickMany: true,
    });

    if (!selectedSpecs) {
      return;
    }

    const verifyOptions = await vscode.window.showQuickPick(
      [
        { label: 'Include code examples', description: 'Show code examples in feedback', picked: true },
        { label: 'Skip low severity issues', description: 'Hide low severity issues', picked: false },
        { label: 'Limit to 10 issues', description: 'Show maximum 10 issues', picked: false },
      ],
      {
        placeHolder: 'Verification options',
        canPickMany: true,
      }
    );

    const epicMetadata = await context.epicMetadataManager.loadEpicMetadata();

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Verifying Changes',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: 'Analyzing changes...' });

        const verification = await context.verificationEngine.verifyChanges({
          epicId: epicMetadata.epicId,
          specIds: selectedSpecs.map((s) => s.id),
          diffInput: {
            content: diffContent,
            format: inputOptions.value === 'manual' ? 'unified' : (inputOptions.value as 'git' | 'github' | 'gitlab'),
            metadata,
          },
          options: {
            includeCodeExamples: verifyOptions?.some((o) => o.label === 'Include code examples'),
            skipLowSeverity: verifyOptions?.some((o) => o.label === 'Skip low severity issues'),
            maxIssues: verifyOptions?.some((o) => o.label === 'Limit to 10 issues') ? 10 : undefined,
          },
        });

        progress.report({ message: 'Displaying results...' });

        context.verificationViewProvider.showVerification(verification.id);
        await vscode.commands.executeCommand('flowguard.verificationView.focus');

        const summary = verification.summary;
        const icon = summary.passed ? '$(check)' : '$(alert)';
        const messageText = `Verification complete: ${summary.totalIssues} issues found`;

        vscode.window.showInformationMessage(`${icon} ${messageText}`);
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to verify changes: ${errorMessage}`);
  }
}

export async function verifyCurrentFileCommand(context: CommandContext): Promise<void> {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No file is currently open.');
      return;
    }

    const document = editor.document;
    const filePath = document.fileName;

    const diffContent = await context.gitHelper.getDiff(filePath);
    if (!diffContent) {
      vscode.window.showInformationMessage('No changes detected in the current file.');
      return;
    }

    const specs = await context.storage.listSpecs();

    const autoSelectedSpecs = specs.filter((spec) => {
      const specPath = context.storage.getArtifactPath('spec', spec.id);
      const specDir = specPath.substring(0, specPath.lastIndexOf('/'));
      return filePath.startsWith(specDir);
    });

    let selectedSpecIds: string[];
    if (autoSelectedSpecs.length > 0) {
      selectedSpecIds = autoSelectedSpecs.map((s) => s.id);
    } else if (specs.length === 0) {
      vscode.window.showInformationMessage('No specs found.');
      return;
    } else {
      const specItems = specs.map((spec) => ({
        label: spec.title,
        description: `Status: ${spec.status}`,
        id: spec.id,
      }));

      const selected = await vscode.window.showQuickPick(specItems, {
        placeHolder: 'Select a spec to verify against',
      });

      if (!selected) {
        return;
      }

      selectedSpecIds = [selected.id];
    }

    const epicMetadata = await context.epicMetadataManager.loadEpicMetadata();

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Verifying Current File',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: 'Analyzing current file...' });

        const verification = await context.verificationEngine.verifyChanges({
          epicId: epicMetadata.epicId,
          specIds: selectedSpecIds,
          diffInput: {
            content: diffContent,
            format: 'git',
            metadata: { branch: await context.gitHelper.getCurrentBranch() },
          },
        });

        progress.report({ message: 'Displaying results...' });

        context.verificationViewProvider.showVerification(verification.id);
        await vscode.commands.executeCommand('flowguard.verificationView.focus');
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to verify current file: ${errorMessage}`);
  }
}

export async function verifyCommitCommand(context: CommandContext): Promise<void> {
  try {
    const commitHash = await vscode.window.showInputBox({
      prompt: 'Enter commit hash',
      placeHolder: 'e.g., abc1234 or abc1234def5678',
      validateInput: (value) => {
        if (!value || value.length < 7) {
          return 'Please enter at least 7 characters of the commit hash';
        }
        return null;
      },
    });

    if (!commitHash) {
      return;
    }

    const specs = await context.storage.listSpecs();
    if (specs.length === 0) {
      vscode.window.showInformationMessage('No specs found to verify against.');
      return;
    }

    const epicMetadata = await context.epicMetadataManager.loadEpicMetadata();

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Verifying Commit',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: 'Getting commit diff...' });

        let diffContent: string;
        try {
          const simpleGit = require('simple-git');
          const git = simpleGit(context.workspaceRoot);
          diffContent = await git.show(commitHash);
        } catch {
          const manualInput = await vscode.window.showInputBox({
            prompt: `Could not get diff for ${commitHash}. Paste diff manually:`,
            placeHolder: 'Paste git diff here...',
          });

          if (!manualInput) {
            return;
          }
          diffContent = manualInput as string;
        }

        progress.report({ message: 'Analyzing commit...' });

        const verification = await context.verificationEngine.verifyChanges({
          epicId: epicMetadata.epicId,
          specIds: specs.map((s) => s.id),
          diffInput: {
            content: diffContent,
            format: 'git',
            metadata: { commitHash },
          },
        });

        progress.report({ message: 'Displaying results...' });

        context.verificationViewProvider.showVerification(verification.id);
        await vscode.commands.executeCommand('flowguard.verificationView.focus');
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to verify commit: ${errorMessage}`);
  }
}
