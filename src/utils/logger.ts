import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('FlowGuard');

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

let currentLevel: LogLevel = 'INFO';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function log(message: string, level: LogLevel = 'INFO'): void {
  if (shouldLog(level)) {
    outputChannel.appendLine(`[${level}] ${new Date().toISOString()} - ${message}`);
  }
}

export function error(message: string): void {
  outputChannel.appendLine(`[ERROR] ${new Date().toISOString()} - ${message}`);
}

export function warn(message: string): void {
  outputChannel.appendLine(`[WARN] ${new Date().toISOString()} - ${message}`);
}

export function debug(message: string): void {
  log(message, 'DEBUG');
}

export function logLLMRequest(provider: string, prompt: string): void {
  const truncatedPrompt = prompt.length > 200 ? prompt.substring(0, 200) + '...' : prompt;
  log(`[${provider}] LLM Request: ${truncatedPrompt}`, 'DEBUG');
}

export function logLLMResponse(provider: string, response: string, tokens: number): void {
  const truncatedResponse = response.length > 200 ? response.substring(0, 200) + '...' : response;
  log(`[${provider}] LLM Response: ${tokens} tokens - ${truncatedResponse}`, 'DEBUG');
}

export function logCodebaseAnalysis(filesAnalyzed: number, duration: number): void {
  log(`Codebase analysis: ${filesAnalyzed} files analyzed in ${duration}ms`);
}

export function logSpecGeneration(specId: string, duration: number): void {
  log(`Spec generation: ${specId} generated in ${duration}ms`);
}

export function logClarificationRequest(goal: string): void {
  const truncatedGoal = goal.length > 100 ? goal.substring(0, 100) + '...' : goal;
  log(`Clarification request: ${truncatedGoal}`);
}

export function logClarificationResponse(questionCount: number): void {
  log(`Clarification response: ${questionCount} questions generated`);
}

export function show(): void {
  outputChannel.show();
}

export function clear(): void {
  outputChannel.clear();
}

function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  return levels.indexOf(level) >= levels.indexOf(currentLevel);
}
