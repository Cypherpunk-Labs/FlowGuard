import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { CommandContext } from './types';
import { Spec, SpecStatus } from '../core/models/Spec';

export async function createSpecCommand(
  context: CommandContext,
  ...args: unknown[]
): Promise<void> {
  const prefillTitle = args[0] as string | undefined;
  const prefillTags = args[1] as string[] | undefined;
  try {
    const epicMetadata = await context.epicMetadataManager.loadEpicMetadata();

    let title = prefillTitle;
    if (!title) {
      title = await vscode.window.showInputBox({
        prompt: 'Enter spec title',
        placeHolder: 'e.g., User Login API',
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Spec title is required';
          }
          return null;
        },
      });
    }

    if (!title) {
      return;
    }

    const now = new Date();
    const spec: Spec = {
      id: uuidv4(),
      epicId: epicMetadata.epicId,
      title,
      status: 'draft' as SpecStatus,
      createdAt: now,
      updatedAt: now,
      author: 'FlowGuard',
      tags: prefillTags || [],
      content: `# ${title}\n\n## Overview\n\nDescribe your specification here.\n\n## Requirements\n\n- \n- \n\n## Implementation Notes\n\n`,
    };

    await context.storage.saveSpec(spec);
    await context.epicMetadataManager.registerArtifact('spec', spec.id);

    await openSpecInEditor(context, spec.id);

    context.sidebarProvider.refresh();

    vscode.window.showInformationMessage(`Spec "${title}" created successfully!`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('not initialized')) {
      vscode.window.showErrorMessage('No epic initialized. Please initialize an epic first.');
    } else {
      vscode.window.showErrorMessage(`Failed to create spec: ${errorMessage}`);
    }
  }
}

export async function openSpecCommand(context: CommandContext): Promise<void> {
  try {
    const specs = await context.storage.listSpecs();

    if (specs.length === 0) {
      vscode.window.showInformationMessage('No specs found. Create a spec first.');
      return;
    }

    const items = specs.map((spec) => ({
      label: spec.title,
      description: `Status: ${spec.status}`,
      detail: `Created: ${spec.createdAt.toLocaleDateString()}`,
      id: spec.id,
      status: spec.status,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a spec to open',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected) {
      await openSpecInEditor(context, selected.id);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to open spec: ${errorMessage}`);
  }
}

export async function approveSpecCommand(context: CommandContext): Promise<void> {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No editor is active');
      return;
    }

    const document = editor.document;
    const fileName = document.fileName;

    if (!fileName.includes('spec-') || !fileName.endsWith('.md')) {
      vscode.window.showErrorMessage('This command can only be used in spec files');
      return;
    }

    const specId = extractIdFromFilename(fileName, 'spec-');
    const spec = await context.storage.loadSpec(specId);

    await context.storage.saveSpec({
      ...spec,
      status: 'approved' as SpecStatus,
      updatedAt: new Date(),
    });

    await context.epicMetadataManager.updateEpicMetadata({});

    context.sidebarProvider.refresh();

    vscode.window.showInformationMessage(`Spec "${spec.title}" approved successfully!`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to approve spec: ${errorMessage}`);
  }
}

async function openSpecInEditor(context: CommandContext, specId: string): Promise<void> {
  const specPath = context.storage.getArtifactPath('spec', specId);
  const uri = vscode.Uri.file(specPath);
  await vscode.commands.executeCommand('vscode.openWith', uri, 'flowguard.specEditor');
}

function extractIdFromFilename(filename: string, prefix: string): string {
  const match = filename.match(new RegExp(`${prefix}(.+)\\.md`));
  if (match && match[1]) {
    return match[1];
  }
  throw new Error(`Invalid filename format: ${filename}`);
}
