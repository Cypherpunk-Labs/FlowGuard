import * as vscode from 'vscode';
import { CommandContext } from './types';
import {
  createEpicCommand,
  initializeEpicCommand,
} from './epicCommands';
import {
  createSpecCommand,
  openSpecCommand,
  approveSpecCommand,
} from './specCommands';
import {
  createTicketCommand,
  openTicketCommand,
  assignTicketCommand,
} from './ticketCommands';
import {
  generateHandoffCommand,
  copyHandoffToClipboardCommand,
  previewHandoffCommand,
} from './handoffCommands';
import {
  verifyChangesCommand,
  verifyCurrentFileCommand,
  verifyCommitCommand,
} from './verificationCommands';
import {
  refreshSidebarCommand,
  showVerificationCommand,
  showExecutionCommand,
  goToSpecCommand,
  goToTicketCommand,
} from './navigationCommands';
import {
  listPluginsCommand,
  reloadPluginCommand,
  installPluginCommand,
  uninstallPluginCommand,
  reloadAllPluginsCommand,
} from './pluginCommands';

export interface CommandHandler {
  (context: CommandContext, ...args: unknown[]): Promise<unknown>;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  commandContext: CommandContext
): void {
  const commands: Array<{ id: string; handler: CommandHandler }> = [
    { id: 'flowguard.createEpic', handler: createEpicCommand },
    { id: 'flowguard.initializeEpic', handler: initializeEpicCommand },
    { id: 'flowguard.createSpec', handler: createSpecCommand },
    { id: 'flowguard.openSpec', handler: openSpecCommand },
    { id: 'flowguard.approveSpec', handler: approveSpecCommand },
    { id: 'flowguard.createTicket', handler: createTicketCommand },
    { id: 'flowguard.openTicket', handler: openTicketCommand },
    { id: 'flowguard.assignTicket', handler: assignTicketCommand },
    { id: 'flowguard.generateHandoff', handler: generateHandoffCommand },
    { id: 'flowguard.copyHandoffToClipboard', handler: copyHandoffToClipboardCommand },
    { id: 'flowguard.previewHandoff', handler: previewHandoffCommand },
    { id: 'flowguard.verifyChanges', handler: verifyChangesCommand },
    { id: 'flowguard.verifyCurrentFile', handler: verifyCurrentFileCommand },
    { id: 'flowguard.verifyCommit', handler: verifyCommitCommand },
    { id: 'flowguard.refreshSidebar', handler: refreshSidebarCommand },
    { id: 'flowguard.showVerification', handler: showVerificationCommand },
    { id: 'flowguard.showExecution', handler: showExecutionCommand },
    { id: 'flowguard.goToSpec', handler: goToSpecCommand },
    { id: 'flowguard.goToTicket', handler: goToTicketCommand },
    { id: 'flowguard.applyAutoFix', handler: applyAutoFixCommand },
    { id: 'flowguard.ignoreIssue', handler: ignoreIssueCommand },
    { id: 'flowguard.listPlugins', handler: listPluginsCommand },
    { id: 'flowguard.reloadPlugin', handler: reloadPluginCommand },
    { id: 'flowguard.installPlugin', handler: installPluginCommand },
    { id: 'flowguard.uninstallPlugin', handler: uninstallPluginCommand },
    { id: 'flowguard.reloadAllPlugins', handler: reloadAllPluginsCommand },
  ];

  commands.forEach(({ id, handler }) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(id, (...args: unknown[]) =>
        handler(commandContext, ...args)
      )
    );
  });
}

async function applyAutoFixCommand(
  context: CommandContext,
  ...args: unknown[]
): Promise<void> {
  const verificationId = args[0] as string;
  const issueId = args[1] as string;
  if (context.verificationViewProvider) {
    context.verificationViewProvider.refresh();
  }
}

async function ignoreIssueCommand(
  context: CommandContext,
  ...args: unknown[]
): Promise<void> {
  const verificationId = args[0] as string;
  const issueId = args[1] as string;
  if (context.verificationViewProvider) {
    context.verificationViewProvider.refresh();
  }
}

export * from './types';
export * from './epicCommands';
export * from './specCommands';
export * from './ticketCommands';
export * from './handoffCommands';
export * from './verificationCommands';
export * from './navigationCommands';
export * from './pluginCommands';
