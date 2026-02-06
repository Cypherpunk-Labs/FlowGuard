import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { CommandContext } from './types';
import { Epic, EpicStatus } from '../core/models/Epic';
import { TechnicalPlan } from '../core/models/TechnicalPlan';
import { Diagram } from '../core/models/Diagram';

export async function createEpicCommand(context: CommandContext): Promise<void> {
  try {
    const epicTitle = await vscode.window.showInputBox({
      prompt: 'Enter epic title',
      placeHolder: 'e.g., User Authentication System',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Epic title is required';
        }
        return null;
      },
    });

    if (!epicTitle) {
      return;
    }

    const epicOverview = await vscode.window.showInputBox({
      prompt: 'Enter epic overview (optional)',
      placeHolder: 'Brief description of the epic',
    });

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Creating Epic',
        cancellable: true,
      },
      async (progress, token) => {
        try {
          progress.report({ message: 'Initializing epic...' });

          const epicId = uuidv4();
          const epic: Epic = {
            id: epicId,
            title: epicTitle,
            overview: epicOverview || '',
            phases: [],
            technicalPlan: {
              files: [],
              dependencies: [],
              edgeCases: [],
              nonFunctionalRequirements: [],
              testingStrategy: { unitTests: '', integrationTests: '', e2eTests: '' },
            },
            diagrams: [],
            metadata: {
              author: 'FlowGuard',
              tags: [],
              priority: 'medium',
            },
            status: 'draft' as EpicStatus,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await context.epicMetadataManager.initializeEpic(epic);
          await context.storage.initialize();

          progress.report({ message: 'Epic initialized. Running planning workflow...' });

          const runWorkflow = await vscode.window.showInformationMessage(
            'Would you like to run the planning workflow to generate specs and tickets?',
            'Yes, run workflow',
            'No, just create epic'
          );

          if (runWorkflow === 'Yes, run workflow') {
            const includeCodebase = await vscode.window.showQuickPick(
              [
                { label: 'Yes', description: 'Include codebase context', value: true },
                { label: 'No', description: 'Generate without codebase context', value: false },
              ],
              { placeHolder: 'Include codebase context?' }
            );

            const includeCodebaseContext = includeCodebase?.value ?? false;

            const onProgress = (phase: string, pct: number) => {
              const phaseMessages: Record<string, string> = {
                clarification: 'Gathering requirements...',
                spec_generation: 'Generating specification...',
                ticket_generation: 'Creating tickets...',
                validation: 'Validating artifacts...',
                complete: 'Workflow complete!',
              };
              progress.report({
                message: phaseMessages[phase] || phase,
                increment: pct,
              });
            };

            const onQuestionsGenerated = async (questions: string[]): Promise<string[]> => {
              const answers: string[] = [];
              for (const question of questions) {
                if (token.isCancellationRequested) {
                  return answers;
                }
                const answer = await vscode.window.showInputBox({
                  prompt: question,
                  placeHolder: 'Enter your answer',
                });
                if (answer) {
                  answers.push(answer);
                }
              }
              return answers;
            };

            const result = await context.workflowOrchestrator.executeWorkflow({
              epicId,
              goal: epicTitle,
              onProgress,
              onQuestionsGenerated,
              includeCodebaseContext,
            });

            progress.report({ message: 'Saving artifacts...' });

            await context.storage.saveSpec(result.spec);
            await context.epicMetadataManager.registerArtifact('spec', result.spec.id);

            for (const ticket of result.tickets) {
              await context.storage.saveTicket(ticket);
              await context.epicMetadataManager.registerArtifact('ticket', ticket.id);
            }

            progress.report({ message: 'Refreshing sidebar...' });

            context.sidebarProvider.refresh();

            vscode.window.showInformationMessage(
              `Epic "${epicTitle}" created successfully! ` +
              `Created 1 spec and ${result.tickets.length} tickets.`
            );
          } else {
            progress.report({ message: 'Epic created successfully!', increment: 100 });

            context.sidebarProvider.refresh();

            vscode.window.showInformationMessage(
              `Epic "${epicTitle}" created successfully! You can now create specs and tickets.`
            );
          }

          await vscode.commands.executeCommand('flowguard.sidebarView.focus');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          vscode.window.showErrorMessage(`Failed to create epic: ${errorMessage}`);
          throw error;
        }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Failed to create epic: ${errorMessage}`);
  }
}

export async function initializeEpicCommand(context: CommandContext): Promise<void> {
  try {
    const workspaces = vscode.workspace.workspaceFolders;
    let workspaceRoot = workspaces?.[0]?.uri.fsPath;

    if (workspaces && workspaces.length > 1) {
      const selected = await vscode.window.showWorkspaceFolderPick({
        placeHolder: 'Select a workspace to initialize epic',
      });
      if (selected) {
        workspaceRoot = selected.uri.fsPath;
      }
    }

    if (!workspaceRoot) {
      vscode.window.showErrorMessage('No workspace selected');
      return;
    }

    const title = await vscode.window.showInputBox({
      prompt: 'Enter epic title',
      placeHolder: 'e.g., User Authentication System',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Epic title is required';
        }
        return null;
      },
    });

    if (!title) {
      return;
    }

    const overview = await vscode.window.showInputBox({
      prompt: 'Enter epic overview (optional)',
      placeHolder: 'Brief description of the epic',
    });

    const epic: Epic = {
      id: uuidv4(),
      title,
      overview: overview || '',
      phases: [],
      technicalPlan: {
        files: [],
        dependencies: [],
        edgeCases: [],
        nonFunctionalRequirements: [],
        testingStrategy: { unitTests: '', integrationTests: '', e2eTests: '' },
      },
      diagrams: [],
      metadata: {
        author: 'FlowGuard',
        tags: [],
        priority: 'medium',
      },
      status: 'draft' as EpicStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await context.epicMetadataManager.initializeEpic(epic);
    await context.storage.initialize();

    context.sidebarProvider.refresh();

    vscode.window.showInformationMessage(
      `Epic "${title}" initialized successfully!`,
      'Create Spec',
      'Create Ticket'
    ).then((selection) => {
      if (selection === 'Create Spec') {
        vscode.commands.executeCommand('flowguard.createSpec');
      } else if (selection === 'Create Ticket') {
        vscode.commands.executeCommand('flowguard.createTicket');
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('already exists')) {
      vscode.window.showWarningMessage('Epic is already initialized in this workspace');
    } else {
      vscode.window.showErrorMessage(`Failed to initialize epic: ${errorMessage}`);
    }
  }
}
