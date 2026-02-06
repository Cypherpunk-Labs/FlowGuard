import * as vscode from 'vscode';
import { CommandContext } from './types';

export async function refreshSidebarCommand(context: CommandContext): Promise<void> {
  try {
    context.sidebarProvider.refresh();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to refresh sidebar: ${errorMessage}`);
  }
}

export async function showVerificationCommand(
  context: CommandContext,
  ...args: unknown[]
): Promise<void> {
  const verificationId = args[0] as string | undefined;
  try {
    if (verificationId) {
      context.verificationViewProvider.showVerification(verificationId);
    }
    await vscode.commands.executeCommand('flowguard.verificationView.focus');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to show verification: ${errorMessage}`);
  }
}

export async function showExecutionCommand(
  context: CommandContext,
  ...args: unknown[]
): Promise<void> {
  const executionId = args[0] as string | undefined;
  try {
    if (executionId) {
      context.executionViewProvider.showExecution(executionId);
    }
    await vscode.commands.executeCommand('flowguard.executionView.focus');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to show execution: ${errorMessage}`);
  }
}

export async function goToSpecCommand(context: CommandContext): Promise<void> {
  try {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No editor is active');
      return;
    }

    const document = editor.document;
    const fileName = document.fileName;

    if (!fileName.includes('ticket-') || !fileName.endsWith('.md')) {
      vscode.window.showErrorMessage('This command can only be used in ticket files');
      return;
    }

    const ticketId = extractIdFromFilename(fileName, 'ticket-');
    const ticket = await context.storage.loadTicket(ticketId);

    if (!ticket.specId) {
      vscode.window.showErrorMessage('This ticket does not have a linked spec.');
      return;
    }

    await openSpecInEditor(context, ticket.specId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to go to spec: ${errorMessage}`);
  }
}

export async function goToTicketCommand(context: CommandContext): Promise<void> {
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

    const tickets = await context.storage.listTickets(undefined, specId);

    if (tickets.length === 0) {
      vscode.window.showInformationMessage('No tickets found for this spec.');
      return;
    }

    const ticketItems = tickets.map((ticket) => ({
      label: ticket.title,
      description: `Priority: ${ticket.priority} | Status: ${ticket.status}`,
      id: ticket.id,
    }));

    const selected = await vscode.window.showQuickPick(ticketItems, {
      placeHolder: 'Select a ticket to open',
    });

    if (selected) {
      await openTicketInEditor(context, selected.id);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to go to ticket: ${errorMessage}`);
  }
}

async function openSpecInEditor(context: CommandContext, specId: string): Promise<void> {
  const specPath = context.storage.getArtifactPath('spec', specId);
  const uri = vscode.Uri.file(specPath);
  await vscode.commands.executeCommand('vscode.openWith', uri, 'flowguard.specEditor');
}

async function openTicketInEditor(context: CommandContext, ticketId: string): Promise<void> {
  const ticketPath = context.storage.getArtifactPath('ticket', ticketId);
  const uri = vscode.Uri.file(ticketPath);
  await vscode.commands.executeCommand('vscode.openWith', uri, 'flowguard.ticketEditor');
}

function extractIdFromFilename(filename: string, prefix: string): string {
  const match = filename.match(new RegExp(`${prefix}(.+)\\.md`));
  if (match && match[1]) {
    return match[1];
  }
  throw new Error(`Invalid filename format: ${filename}`);
}
