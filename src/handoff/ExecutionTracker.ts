import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { Execution, ExecutionStatus, ExecutionResults, HandoffInput } from './types';
import { generateUUID } from '../utils/uuid';

export class ExecutionTracker {
  private storage: ArtifactStorage;

  constructor(storage: ArtifactStorage) {
    this.storage = storage;
  }

  async createExecution(input: HandoffInput, handoffPrompt: string): Promise<Execution> {
    const id = generateUUID();
    
    const execution: Execution = {
      id,
      epicId: input.epicId,
      specIds: input.specIds,
      ticketIds: input.ticketIds,
      agentType: input.agentType,
      handoffPrompt,
      status: 'pending' as ExecutionStatus,
      startedAt: new Date(),
    };

    await this.storage.saveExecution(execution);
    return execution;
  }

  async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    results?: ExecutionResults
  ): Promise<void> {
    const execution = await this.storage.loadExecution(executionId);
    
    execution.status = status;
    
    if (results) {
      execution.results = results;
    }
    
    if (status === 'completed' || status === 'failed') {
      execution.completedAt = new Date();
    }
    
    await this.storage.saveExecution(execution);
  }

  async getExecutionsByEpic(epicId: string): Promise<Execution[]> {
    const executions = await this.storage.listExecutions();
    
    return executions
      .filter(e => e.epicId === epicId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  async getExecutionById(executionId: string): Promise<Execution> {
    return await this.storage.loadExecution(executionId);
  }
}
