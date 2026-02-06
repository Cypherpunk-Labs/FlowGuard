import * as vscode from 'vscode';
import { CommandContext, AgentType, AGENT_TYPES } from './types';

let lastHandoffMarkdown: string = '';
let lastHandoffExecutionId: string = '';

export async function generateHandoffCommand(context: CommandContext): Promise<void> {
  try {
    const specs = await context.storage.listSpecs();

    if (specs.length === 0) {
      vscode.window.showInformationMessage('No specs found. Create a spec first.');
      return;
    }

    const specItems = specs.map((spec) => ({
      label: spec.title,
      description: `Status: ${spec.status}`,
      id: spec.id,
    }));

    const selectedSpecs = await vscode.window.showQuickPick(specItems, {
      placeHolder: 'Select specs to include (you can select multiple)',
      canPickMany: true,
    });

    if (!selectedSpecs || selectedSpecs.length === 0) {
      return;
    }

    const tickets = await context.storage.listTickets();
    const ticketsForSpecs = tickets.filter((t) =>
      selectedSpecs.some((s) => s.id === t.specId)
    );

    const ticketItems = ticketsForSpecs.map((ticket) => ({
      label: ticket.title,
      description: `Priority: ${ticket.priority}`,
      id: ticket.id,
    }));

    const selectedTickets = await vscode.window.showQuickPick(ticketItems, {
      placeHolder: 'Select tickets to include (you can select multiple)',
      canPickMany: true,
    });

    if (!selectedTickets) {
      return;
    }

    const agentItems = AGENT_TYPES.map((agent) => ({
      label: agent.charAt(0).toUpperCase() + agent.slice(1),
      id: agent,
    }));

    const selectedAgent = await vscode.window.showQuickPick(agentItems, {
      placeHolder: 'Select agent type',
    });

    if (!selectedAgent) {
      return;
    }

    const includeCodebase = await vscode.window.showQuickPick(
      [
        { label: 'Yes', description: 'Include codebase context', value: true },
        { label: 'No', description: 'Generate handoff without codebase context', value: false },
      ],
      {
        placeHolder: 'Include codebase context?',
      }
    );

    if (!includeCodebase) {
      return;
    }

    const epicMetadata = await context.epicMetadataManager.loadEpicMetadata();

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Generating Handoff',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ message: 'Loading artifacts...' });

        const result = await context.handoffGenerator.generateHandoff({
          epicId: epicMetadata.epicId,
          specIds: selectedSpecs.map((s) => s.id),
          ticketIds: selectedTickets.map((t) => t.id),
          agentType: selectedAgent.id as AgentType,
          includeCodebaseContext: includeCodebase.value,
        });

        lastHandoffMarkdown = result.markdown;
        lastHandoffExecutionId = result.execution.id;

        progress.report({ message: 'Displaying handoff...' });

        const panel = vscode.window.createWebviewPanel(
          'flowguardHandoffPreview',
          `Handoff: ${epicMetadata.title}`,
          vscode.ViewColumn.One,
          { enableScripts: true }
        );

        panel.webview.html = generateHandoffHtml(
          result.markdown,
          result.metadata,
          result.execution
        );

        panel.webview.onDidReceiveMessage(async (message) => {
          if (message.type === 'copy') {
            await vscode.env.clipboard.writeText(message.content);
            panel.webview.postMessage({ type: 'copied' });
          } else if (message.type === 'save') {
            const uri = await vscode.window.showSaveDialog({
              defaultUri: vscode.Uri.file(`handoff-${result.execution.id}.md`),
              filters: { 'Markdown': ['md'] }
            });
            if (uri) {
              const wsEdit = new vscode.WorkspaceEdit();
              wsEdit.createFile(uri, { ignoreIfExists: true });
              await vscode.workspace.applyEdit(wsEdit);
              const doc = await vscode.workspace.openTextDocument(uri);
              await vscode.window.showTextDocument(doc);
              const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
              if (editor) {
                await editor.edit(editBuilder => {
                  editBuilder.insert(new vscode.Position(0, 0), message.content);
                });
              }
            }
          }
        });

        panel.reveal();
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to generate handoff: ${errorMessage}`);
  }
}

export async function copyHandoffToClipboardCommand(context: CommandContext): Promise<void> {
  if (!lastHandoffMarkdown) {
    vscode.window.showWarningMessage('No handoff to copy. Generate a handoff first.');
    return;
  }

  try {
    await vscode.env.clipboard.writeText(lastHandoffMarkdown);
    vscode.window.showInformationMessage('Handoff copied to clipboard!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to copy to clipboard: ${errorMessage}`);
  }
}

export async function previewHandoffCommand(context: CommandContext): Promise<void> {
  try {
    const specs = await context.storage.listSpecs();

    if (specs.length === 0) {
      vscode.window.showInformationMessage('No specs found.');
      return;
    }

    const selectedSpec = await vscode.window.showQuickPick(
      specs.map((spec) => ({
        label: spec.title,
        id: spec.id,
      })),
      { placeHolder: 'Select a spec to preview' }
    );

    if (!selectedSpec) {
      return;
    }

    const tickets = await context.storage.listTickets(undefined, selectedSpec.id);
    const ticketItems = tickets.map((ticket) => ({
      label: ticket.title,
      id: ticket.id,
    }));

    const selectedTickets = await vscode.window.showQuickPick(ticketItems, {
      placeHolder: 'Select tickets (can pick multiple)',
      canPickMany: true,
    });

    if (!selectedTickets) {
      return;
    }

    const agentItems = AGENT_TYPES.map((agent) => ({
      label: agent.charAt(0).toUpperCase() + agent.slice(1),
      id: agent,
    }));

    const selectedAgent = await vscode.window.showQuickPick(agentItems, {
      placeHolder: 'Select agent type',
    });

    if (!selectedAgent) {
      return;
    }

    const includeCodebase = await vscode.window.showQuickPick(
      [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
      { placeHolder: 'Include codebase context?' }
    );

    if (!includeCodebase) {
      return;
    }

    const epicMetadata = await context.epicMetadataManager.loadEpicMetadata();

    const preview = await context.handoffGenerator.generatePreview({
      epicId: epicMetadata.epicId,
      specIds: [selectedSpec.id],
      ticketIds: selectedTickets.map((t) => t.id),
      agentType: selectedAgent.id as AgentType,
      includeCodebaseContext: includeCodebase.value,
    });

    const panel = vscode.window.createWebviewPanel(
      'flowguardHandoffPreview',
      'Handoff Preview',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Handoff Preview</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
    pre { padding: 20px; white-space: pre-wrap; font-family: monospace; }
    .actions { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
    button { padding: 8px 16px; margin-right: 10px; cursor: pointer; }
    .copy-btn { background: #007acc; color: white; border: none; border-radius: 3px; }
    .save-btn { background: #28a745; color: white; border: none; border-radius: 3px; }
  </style>
</head>
<body>
  <pre>${preview}</pre>
  <div class="actions">
    <button class="copy-btn" onclick="copyToClipboard()">Copy to Clipboard</button>
    <button class="save-btn" onclick="saveToFile()">Save to File</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    function copyToClipboard() {
      const content = document.querySelector('pre').innerText;
      vscode.postMessage({ type: 'copy', content });
    }
    function saveToFile() {
      const content = document.querySelector('pre').innerText;
      vscode.postMessage({ type: 'save', content });
    }
    window.addEventListener('message', event => {
      if (event.data.type === 'copied') {
        alert('Copied to clipboard!');
      }
    });
  </script>
</body>
</html>`;

    panel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'copy') {
        await vscode.env.clipboard.writeText(message.content);
        panel.webview.postMessage({ type: 'copied' });
      } else if (message.type === 'save') {
        const uri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file('handoff-preview.md'),
          filters: { 'Markdown': ['md'] }
        });
        if (uri) {
          const wsEdit = new vscode.WorkspaceEdit();
          wsEdit.createFile(uri, { ignoreIfExists: true });
          await vscode.workspace.applyEdit(wsEdit);
          const doc = await vscode.workspace.openTextDocument(uri);
          await vscode.window.showTextDocument(doc);
          const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
          if (editor) {
            await editor.edit(editBuilder => {
              editBuilder.insert(new vscode.Position(0, 0), message.content);
            });
          }
        }
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to preview handoff: ${errorMessage}`);
  }
}

function generateHandoffHtml(
  markdown: string,
  metadata: { wordCount: number; estimatedReadingTime: number; specCount: number; ticketCount: number },
  execution: { id: string; agentType: string; status: string }
): string {
  const escapedMarkdown = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Handoff Preview</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
    .header { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .meta { display: flex; gap: 20px; flex-wrap: wrap; }
    .meta-item { font-size: 14px; }
    .content { line-height: 1.6; white-space: pre-wrap; }
    .actions { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
    button { padding: 8px 16px; margin-right: 10px; cursor: pointer; }
    .copy-btn { background: #007acc; color: white; border: none; border-radius: 3px; }
    .save-btn { background: #28a745; color: white; border: none; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Handoff Generated</h2>
    <div class="meta">
      <span class="meta-item"><strong>Execution ID:</strong> ${execution.id}</span>
      <span class="meta-item"><strong>Agent:</strong> ${execution.agentType}</span>
      <span class="meta-item"><strong>Status:</strong> ${execution.status}</span>
      <span class="meta-item"><strong>Specs:</strong> ${metadata.specCount}</span>
      <span class="meta-item"><strong>Tickets:</strong> ${metadata.ticketCount}</span>
      <span class="meta-item"><strong>Words:</strong> ${metadata.wordCount}</span>
      <span class="meta-item"><strong>Reading Time:</strong> ~${metadata.estimatedReadingTime} min</span>
    </div>
  </div>
  <div class="content">${escapedMarkdown}</div>
  <div class="actions">
    <button class="copy-btn" onclick="copyToClipboard()">Copy to Clipboard</button>
    <button class="save-btn" onclick="saveToFile()">Save to File</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    function copyToClipboard() {
      const content = document.querySelector('.content').innerText;
      vscode.postMessage({ type: 'copy', content });
    }
    function saveToFile() {
      const content = document.querySelector('.content').innerText;
      vscode.postMessage({ type: 'save', content });
    }
    window.addEventListener('message', event => {
      if (event.data.type === 'copied') {
        alert('Copied to clipboard!');
      }
    });
  </script>
</body>
</html>`;
}

export function getLastHandoffMarkdown(): string {
  return lastHandoffMarkdown;
}

export function getLastHandoffExecutionId(): string {
  return lastHandoffExecutionId;
}
