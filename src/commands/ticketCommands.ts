import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { CommandContext } from './types';
import { Ticket, TicketStatus, Priority } from '../core/models/Ticket';

export async function createTicketCommand(
  context: CommandContext,
  ...args: unknown[]
): Promise<void> {
  const preselectedSpecId = args[0] as string | undefined;
  try {
    const epicMetadata = await context.epicMetadataManager.loadEpicMetadata();

    let targetSpecId = preselectedSpecId;

    if (!targetSpecId) {
      const specs = await context.storage.listSpecs();

      if (specs.length === 0) {
        const createSpec = await vscode.window.showInformationMessage(
          'No specs found. Please create a spec first.',
          'Create Spec'
        );
        if (createSpec) {
          await vscode.commands.executeCommand('flowguard.createSpec');
        }
        return;
      }

      const specItems = specs.map((spec) => ({
        label: spec.title,
        description: `Status: ${spec.status}`,
        id: spec.id,
      }));

      if (specs.length === 1) {
        targetSpecId = specs[0]?.id;
      } else {
        const selected = await vscode.window.showQuickPick(specItems, {
          placeHolder: 'Select a spec for this ticket',
        });

        if (!selected) {
          return;
        }

        targetSpecId = selected.id;
      }
    }

    if (!targetSpecId) {
      vscode.window.showErrorMessage('No spec selected');
      return;
    }

    const title = await vscode.window.showInputBox({
      prompt: 'Enter ticket title',
      placeHolder: 'e.g., Implement user login',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Ticket title is required';
        }
        return null;
      },
    });

    if (!title) {
      return;
    }

    const priorityOptions: Array<vscode.QuickPickItem & { value: Priority }> = [
      { label: '$(alert) Critical', description: 'Must be completed immediately', value: 'critical' },
      { label: '$(warning) High', description: 'Important for the release', value: 'high' },
      { label: '$(dash) Medium', description: 'Should be completed', value: 'medium' },
      { label: '$(check) Low', description: 'Nice to have', value: 'low' },
    ];

    const priorityItem = await vscode.window.showQuickPick(priorityOptions, {
      placeHolder: 'Select priority',
      canPickMany: false,
    });

    const priority = priorityItem?.value || 'medium';

    const now = new Date();
    const ticket: Ticket = {
      id: uuidv4(),
      epicId: epicMetadata.epicId,
      specId: targetSpecId,
      title,
      status: 'todo' as TicketStatus,
      priority,
      createdAt: now,
      updatedAt: now,
      tags: [],
      content: `# ${title}\n\n## Description\n\nDescribe the ticket details here.\n\n## Acceptance Criteria\n\n- [ ] \n- [ ] \n\n## Implementation Notes\n\n`,
    };

    await context.storage.saveTicket(ticket);
    await context.epicMetadataManager.registerArtifact('ticket', ticket.id);

    await openTicketInEditor(context, ticket.id);

    context.sidebarProvider.refresh();

    vscode.window.showInformationMessage(`Ticket "${title}" created successfully!`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('not initialized')) {
      vscode.window.showErrorMessage('No epic initialized. Please initialize an epic first.');
    } else {
      vscode.window.showErrorMessage(`Failed to create ticket: ${errorMessage}`);
    }
  }
}

export async function openTicketCommand(context: CommandContext): Promise<void> {
  try {
    const tickets = await context.storage.listTickets();

    if (tickets.length === 0) {
      vscode.window.showInformationMessage('No tickets found. Create a ticket first.');
      return;
    }

    const items = tickets.map((ticket) => {
      const priorityIcon = ticket.priority === 'critical' ? '$(alert)' :
                          ticket.priority === 'high' ? '$(warning)' :
                          ticket.priority === 'medium' ? '$(dash)' : '$(check)';
      return {
        label: `${priorityIcon} ${ticket.title}`,
        description: `Status: ${ticket.status}`,
        detail: `Priority: ${ticket.priority}`,
        id: ticket.id,
      };
    });

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a ticket to open',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (selected) {
      await openTicketInEditor(context, selected.id);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to open ticket: ${errorMessage}`);
  }
}

export async function assignTicketCommand(
  context: CommandContext,
  ...args: unknown[]
): Promise<void> {
  const ticketId = args[0] as string | undefined;
  try {
    let targetTicketId = ticketId;

    if (!targetTicketId) {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No editor is active and no ticket ID provided');
        return;
      }

      const fileName = editor.document.fileName;
      if (!fileName.includes('ticket-') || !fileName.endsWith('.md')) {
        vscode.window.showErrorMessage('This command can only be used in ticket files');
        return;
      }

      targetTicketId = extractIdFromFilename(fileName, 'ticket-');
    }

    const ticket = await context.storage.loadTicket(targetTicketId);

    const assignee = await vscode.window.showInputBox({
      prompt: 'Enter assignee name',
      placeHolder: 'e.g., john.doe',
      value: ticket.assignee || '',
    });

    if (assignee === undefined) {
      return;
    }

    await context.storage.saveTicket({
      ...ticket,
      assignee: assignee || undefined,
      updatedAt: new Date(),
    });

    context.sidebarProvider.refresh();

    if (assignee) {
      vscode.window.showInformationMessage(`Ticket assigned to ${assignee}`);
    } else {
      vscode.window.showInformationMessage('Ticket assignee cleared');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to assign ticket: ${errorMessage}`);
  }
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
