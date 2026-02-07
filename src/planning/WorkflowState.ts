import * as path from 'path';
import * as fs from 'fs/promises';
import { ArtifactStorage } from '../core/storage/ArtifactStorage';

export interface WorkflowStateData {
  id: string;
  epicId: string;
  currentPhase: 'clarification' | 'spec_generation' | 'ticket_generation' | 'validation' | 'complete';
  createdArtifacts: {
    specId?: string;
    ticketIds: string[];
  };
  userResponses: Array<{ question: string; answer: string }>;
  startedAt: Date;
  lastUpdatedAt: Date;
  error?: string;
  cancelled?: boolean;
}

export class WorkflowState {
  private storage: ArtifactStorage;
  private workflowsDir: string;

  constructor(storage: ArtifactStorage) {
    this.storage = storage;
    const specPath = storage.getArtifactPath('spec', 'temp');
    const rootDir = specPath.split('/specs')[0] || '.flowguard';
    this.workflowsDir = path.join(rootDir, 'workflows');
  }

  async saveWorkflowState(state: WorkflowStateData): Promise<void> {
    await this.ensureWorkflowsDir();

    const filePath = this.getWorkflowPath(state.id);
    const stateData = {
      ...state,
      startedAt: state.startedAt.toISOString(),
      lastUpdatedAt: state.lastUpdatedAt.toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(stateData, null, 2));
  }

  async loadWorkflowState(id: string): Promise<WorkflowStateData> {
    const filePath = this.getWorkflowPath(id);
    const content = await fs.readFile(filePath, 'utf-8');
    const stateData = JSON.parse(content);

    return {
      ...stateData,
      startedAt: new Date(stateData.startedAt),
      lastUpdatedAt: new Date(stateData.lastUpdatedAt),
    };
  }

  async listWorkflows(epicId?: string): Promise<WorkflowStateData[]> {
    await this.ensureWorkflowsDir();

    const files = await fs.readdir(this.workflowsDir);
    const workflows: WorkflowStateData[] = [];

    for (const file of files) {
      if (file.startsWith('workflow-') && file.endsWith('.json')) {
        try {
          const id = file.replace('workflow-', '').replace('.json', '');
          const state = await this.loadWorkflowState(id);
          
          if (!epicId || state.epicId === epicId) {
            workflows.push(state);
          }
        } catch (error) {
          console.warn(`Failed to load workflow ${file}:`, error);
        }
      }
    }

    return workflows.sort((a, b) => 
      new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
    );
  }

  async cleanupCompletedWorkflows(olderThan: Date): Promise<void> {
    const workflows = await this.listWorkflows();

    for (const workflow of workflows) {
      if (workflow.currentPhase === 'complete' && workflow.lastUpdatedAt < olderThan) {
        try {
          const filePath = this.getWorkflowPath(workflow.id);
          await fs.unlink(filePath);
        } catch (error) {
          console.warn(`Failed to delete workflow ${workflow.id}:`, error);
        }
      }
    }
  }

  private async ensureWorkflowsDir(): Promise<void> {
    try {
      await fs.access(this.workflowsDir);
    } catch {
      await fs.mkdir(this.workflowsDir, { recursive: true });
    }
  }

  private getWorkflowPath(id: string): string {
    return path.join(this.workflowsDir, `workflow-${id}.json`);
  }
}
