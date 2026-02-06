import * as vscode from 'vscode';
import { ArtifactStorage } from '../core/storage/ArtifactStorage';
import { EpicMetadataManager } from '../core/storage/EpicMetadataManager';
import { WorkflowOrchestrator } from '../planning/WorkflowOrchestrator';
import { VerificationEngine } from '../verification/VerificationEngine';
import { HandoffGenerator } from '../handoff';
import { SidebarProvider } from '../ui/sidebar/SidebarProvider';
import { VerificationViewProvider } from '../ui/views/VerificationViewProvider';
import { ExecutionViewProvider } from '../ui/views/ExecutionViewProvider';
import { GitHelper } from '../core/git/GitHelper';
import { ReferenceResolver } from '../core/references/ReferenceResolver';
import { CodebaseExplorer } from '../planning/codebase/CodebaseExplorer';
import { LLMProvider } from '../llm/types';

export interface CommandContext {
  storage: ArtifactStorage;
  epicMetadataManager: EpicMetadataManager;
  workflowOrchestrator: WorkflowOrchestrator;
  verificationEngine: VerificationEngine;
  handoffGenerator: HandoffGenerator;
  sidebarProvider: SidebarProvider;
  verificationViewProvider: VerificationViewProvider;
  executionViewProvider: ExecutionViewProvider;
  gitHelper: GitHelper;
  referenceResolver: ReferenceResolver;
  codebaseExplorer: CodebaseExplorer;
  llmProvider: LLMProvider;
  workspaceRoot: string;
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface ProgressReporter {
  report(message: string, increment?: number): void;
}

export interface VerificationInputOptions {
  format: 'git' | 'github' | 'gitlab' | 'manual';
  includeCodeExamples?: boolean;
  skipLowSeverity?: boolean;
  maxIssues?: number;
}

export interface HandoffInputOptions {
  agentType: string;
  includeCodebaseContext: boolean;
}

export const AGENT_TYPES = ['cursor', 'claude', 'windsurf', 'cline', 'aider', 'custom'] as const;
export type AgentType = typeof AGENT_TYPES[number];
