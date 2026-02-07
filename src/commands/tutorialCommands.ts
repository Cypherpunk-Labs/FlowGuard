import * as vscode from 'vscode';
import { CommandContext } from './types';
import { TutorialManager } from '../tutorials/TutorialManager';

export async function startTutorialCommand(
  context: CommandContext,
  ...args: unknown[]
): Promise<void> {
  const tutorialId = args[0] as string | undefined;
  
  const tutorialManager = TutorialManager.getInstance();
  
  if (tutorialId) {
    try {
      await tutorialManager.startTutorial(tutorialId);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to start tutorial: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Show tutorial selection quick pick
    const tutorials = [
      { id: 'first-epic', title: 'First Epic Tutorial', description: 'Learn how to create your first epic, spec, and ticket' },
      { id: 'handoff', title: 'Handoff Tutorial', description: 'Learn how to create and use agent handoffs for AI-assisted development' },
      { id: 'verification', title: 'Verification Tutorial', description: 'Learn how to verify your code changes with FlowGuard' }
    ];
    
    const selected = await vscode.window.showQuickPick(
      tutorials.map(t => ({
        label: t.title,
        description: t.description,
        id: t.id
      })),
      {
        placeHolder: 'Select a tutorial to start'
      }
    );
    
    if (selected) {
      try {
        await tutorialManager.startTutorial(selected.id);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to start tutorial: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}
