import * as vscode from 'vscode';
import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import * as logger from '../utils/logger';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: TutorialAction;
  validation: () => Promise<boolean>;
  hints: string[];
}

interface TutorialAction {
  type: 'command' | 'fileOpen' | 'input' | 'validation';
  value: any;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  setArtifactStorage?: (storage: ArtifactStorage, metadataManager?: any) => void;
}

interface TutorialProgress {
  currentStep: number;
  completedSteps: number[];
  startedAt: Date;
  completedAt?: Date;
}

export class TutorialManager {
  private static instance: TutorialManager;
  private tutorials: Map<string, Tutorial> = new Map();
  private progress: Map<string, TutorialProgress> = new Map();
  private readonly storageKey = 'flowguard.tutorial.progress';
  private context: vscode.ExtensionContext | null = null;
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    // Progress will be loaded after context is set
  }

  public static getInstance(): TutorialManager {
    if (!TutorialManager.instance) {
      TutorialManager.instance = new TutorialManager();
    }
    return TutorialManager.instance;
  }

  public initialize(context: vscode.ExtensionContext): void {
    this.context = context;
    this.loadProgress();
  }

  public registerTutorial(tutorial: Tutorial): void {
    this.tutorials.set(tutorial.id, tutorial);
    logger.debug(`Registered tutorial: ${tutorial.id}`);
  }

  public async validateCurrentStep(tutorialId: string): Promise<boolean> {
    const tutorial = this.tutorials.get(tutorialId);
    const progress = this.progress.get(tutorialId);

    if (!tutorial || !progress) {
      return false;
    }

    const step = tutorial.steps[progress.currentStep];
    if (!step) {
      return false;
    }

    try {
      return await step.validation();
    } catch (error) {
      logger.error(`Validation failed for step ${step.id}: ${error}`);
      return false;
    }
  }

  public async startTutorial(tutorialId: string): Promise<void> {
    const tutorial = this.tutorials.get(tutorialId);
    if (!tutorial) {
      throw new Error(`Tutorial not found: ${tutorialId}`);
    }

    // Initialize progress if not exists
    if (!this.progress.has(tutorialId)) {
      this.progress.set(tutorialId, {
        currentStep: 0,
        completedSteps: [],
        startedAt: new Date()
      });
      this.saveProgress();
    }

    await this.showTutorialStep(tutorialId);
  }

  public async nextStep(tutorialId: string): Promise<void> {
    const progress = this.progress.get(tutorialId);
    const tutorial = this.tutorials.get(tutorialId);

    if (!progress || !tutorial) {
      throw new Error(`Tutorial not found: ${tutorialId}`);
    }

    // Validate current step before advancing
    if (!(await this.validateCurrentStep(tutorialId))) {
      vscode.window.showWarningMessage('Please complete the current step first.');
      return;
    }

    // Mark current step as completed
    if (!progress.completedSteps.includes(progress.currentStep)) {
      progress.completedSteps.push(progress.currentStep);
    }

    // Move to next step
    progress.currentStep++;

    // Check if tutorial is complete
    if (progress.currentStep >= tutorial.steps.length) {
      progress.completedAt = new Date();
      vscode.window.showInformationMessage(`Tutorial completed: ${tutorial.title}`);
    }

    this.saveProgress();
    
    if (progress.currentStep < tutorial.steps.length) {
      await this.showTutorialStep(tutorialId);
    }
  }

  public async previousStep(tutorialId: string): Promise<void> {
    const progress = this.progress.get(tutorialId);

    if (!progress) {
      throw new Error(`Tutorial not found: ${tutorialId}`);
    }

    if (progress.currentStep > 0) {
      progress.currentStep--;
      this.saveProgress();
      await this.showTutorialStep(tutorialId);
    }
  }

  public skipTutorial(tutorialId: string): void {
    const progress = this.progress.get(tutorialId);

    if (progress) {
      progress.completedAt = new Date();
      this.saveProgress();
      vscode.window.showInformationMessage('Tutorial skipped');
    }
  }

  public completeTutorial(tutorialId: string): void {
    const progress = this.progress.get(tutorialId);
    const tutorial = this.tutorials.get(tutorialId);

    if (progress && tutorial) {
      progress.completedAt = new Date();
      progress.currentStep = tutorial.steps.length;
      progress.completedSteps = Array.from({ length: tutorial.steps.length }, (_, i) => i);
      this.saveProgress();
      vscode.window.showInformationMessage(`Tutorial completed: ${tutorial.title}`);
    }
  }

  public getTutorialProgress(tutorialId: string): TutorialProgress | undefined {
    return this.progress.get(tutorialId);
  }

  private async showTutorialStep(tutorialId: string): Promise<void> {
    const tutorial = this.tutorials.get(tutorialId);
    const progress = this.progress.get(tutorialId);

    if (!tutorial || !progress) {
      return;
    }

    const step = tutorial.steps[progress.currentStep];
    if (!step) {
      return;
    }

    // Create webview panel for tutorial step
    const panel = vscode.window.createWebviewPanel(
      'flowguardTutorial',
      `Tutorial: ${tutorial.title} - Step ${progress.currentStep + 1}/${tutorial.steps.length}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    panel.webview.html = this.getWebviewContent(tutorial, step, progress);

    // Start polling for validation status
    const pollInterval = setInterval(async () => {
      try {
        const valid = await this.validateCurrentStep(tutorialId);
        panel.webview.postMessage({command: 'updateValidationStatus', valid});
      } catch (error) {
        logger.error(`Polling validation failed: ${error}`);
      }
    }, 2000);

    // Clean up interval when panel is disposed
    panel.onDidDispose(() => {
      clearInterval(pollInterval);
      const existingInterval = this.pollIntervals.get(tutorialId);
      if (existingInterval) {
        clearInterval(existingInterval);
        this.pollIntervals.delete(tutorialId);
      }
    });

    // Store interval for cleanup
    this.pollIntervals.set(tutorialId, pollInterval);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'next':
            await this.nextStep(tutorialId);
            panel.dispose();
            break;
          case 'previous':
            await this.previousStep(tutorialId);
            panel.dispose();
            break;
          case 'skip':
            this.skipTutorial(tutorialId);
            panel.dispose();
            break;
          case 'complete':
            this.completeTutorial(tutorialId);
            panel.dispose();
            break;
          case 'forceNext':
            // Force next step without validation (for demos)
            const currentProgress = this.progress.get(tutorialId);
            if (currentProgress) {
              if (!currentProgress.completedSteps.includes(currentProgress.currentStep)) {
                currentProgress.completedSteps.push(currentProgress.currentStep);
              }
              currentProgress.currentStep++;
              this.saveProgress();
              if (currentProgress.currentStep < (tutorial?.steps.length || 0)) {
                await this.showTutorialStep(tutorialId);
              } else {
                currentProgress.completedAt = new Date();
                this.saveProgress();
                vscode.window.showInformationMessage(`Tutorial completed: ${tutorial?.title || tutorialId}`);
              }
            }
            panel.dispose();
            break;
        }
      },
      undefined,
      []
    );
  }

  private getWebviewContent(tutorial: Tutorial, step: TutorialStep, progress: TutorialProgress): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FlowGuard Tutorial</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
          }
          .header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .step-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .description {
            margin-bottom: 20px;
          }
          .hints {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 10px;
            margin-bottom: 20px;
          }
          .hint-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .progress {
            margin-bottom: 20px;
          }
          .progress-bar {
            width: 100%;
            height: 10px;
            background-color: var(--vscode-progressBar-background);
            border-radius: 5px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background-color: var(--vscode-progressBar-foreground);
            width: ${(progress.completedSteps.length / tutorial.steps.length) * 100}%;
          }
          .buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
          }
          button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 2px;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .validation-status {
            margin-top: 10px;
            padding: 5px;
            border-radius: 3px;
          }
          .validation-valid {
            background-color: var(--vscode-editorGutter-addedBackground);
            color: var(--vscode-editor-foreground);
          }
          .validation-invalid {
            background-color: var(--vscode-editorGutter-deletedBackground);
            color: var(--vscode-editor-foreground);
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${tutorial.title}</div>
          <div>Step ${progress.currentStep + 1} of ${tutorial.steps.length}</div>
        </div>
        
        <div class="progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
        
        <div class="step-title">${step.title}</div>
        <div class="description">${step.description}</div>
        
        <div class="hints">
          <div class="hint-title">Hints:</div>
          <ul>
            ${step.hints.map(hint => `<li>${hint}</li>`).join('')}
          </ul>
        </div>
        
        <div id="validation-status" class="validation-status validation-invalid">
          Validating step completion...
        </div>
        
        <div class="buttons">
          ${progress.currentStep > 0 ? '<button id="previous">Previous</button>' : ''}
          <button id="next" disabled>Next</button>
          <button id="skip">Skip Tutorial</button>
          <button id="force-next" title="Force next step (for demos)">Force Next</button>
          ${progress.currentStep === tutorial.steps.length - 1 ? '<button id="complete">Complete</button>' : ''}
        </div>
        
        <script>
          const vscode = acquireVsCodeApi();
          
          // Listen for validation status updates
          window.addEventListener('message', (event) => {
            if (event.data.command === 'updateValidationStatus') {
              const statusElement = document.getElementById('validation-status');
              const nextButton = document.getElementById('next');
              
              if (event.data.valid) {
                statusElement.textContent = 'Step completed successfully!';
                statusElement.className = 'validation-status validation-valid';
                nextButton.disabled = false;
              } else {
                statusElement.textContent = 'Please complete the current step to continue.';
                statusElement.className = 'validation-status validation-invalid';
                nextButton.disabled = true;
              }
            }
          });
          
          document.getElementById('next')?.addEventListener('click', () => {
            vscode.postMessage({ command: 'next' });
          });
          
          document.getElementById('previous')?.addEventListener('click', () => {
            vscode.postMessage({ command: 'previous' });
          });
          
          document.getElementById('skip')?.addEventListener('click', () => {
            vscode.postMessage({ command: 'skip' });
          });
          
          document.getElementById('complete')?.addEventListener('click', () => {
            vscode.postMessage({ command: 'complete' });
          });
          
          document.getElementById('force-next')?.addEventListener('click', () => {
            vscode.postMessage({ command: 'forceNext' });
          });
          
          // Request initial validation status
          vscode.postMessage({ command: 'requestValidationStatus' });
        </script>
      </body>
      </html>
    `;
  }

  private loadProgress(): void {
    if (!this.context) {
      return;
    }
    
    try {
      const savedProgress = this.context.globalState.get<Record<string, TutorialProgress>>(this.storageKey, {});
      
      for (const [tutorialId, progress] of Object.entries(savedProgress)) {
        // Convert date strings back to Date objects
        progress.startedAt = new Date(progress.startedAt);
        if (progress.completedAt) {
          progress.completedAt = new Date(progress.completedAt);
        }
        this.progress.set(tutorialId, progress);
      }
    } catch (error) {
      logger.error(`Failed to load tutorial progress: ${error}`);
    }
  }

  private saveProgress(): void {
    if (!this.context) {
      return;
    }
    
    try {
      const progressObj: Record<string, TutorialProgress> = {};
      // Convert Map to object using Array.from to avoid iteration issues
      Array.from(this.progress.entries()).forEach(([tutorialId, progress]) => {
        progressObj[tutorialId] = progress;
      });
      
      this.context.globalState.update(this.storageKey, progressObj);
    } catch (error) {
      logger.error(`Failed to save tutorial progress: ${error}`);
    }
  }
}
