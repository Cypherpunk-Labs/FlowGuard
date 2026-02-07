import type { ViewRequestMessage, ViewResponseMessage, ExecutionData } from '../types';

interface VSCodeApi {
  postMessage(message: ViewRequestMessage): void;
  getState(): any;
  setState(state: any): void;
}

declare global {
  interface Window {
    acquireVsCodeApi(): VSCodeApi;
  }
}

let vscode: VSCodeApi | null = null;

export function getVscodeApi(): VSCodeApi {
  if (!vscode) {
    vscode = window.acquireVsCodeApi();
  }
  return vscode;
}

export function postMessage(message: ViewRequestMessage): void {
  getVscodeApi().postMessage(message);
}

export function getExecution(executionId: string): void {
  postMessage({ type: 'getExecution', executionId });
}

export function openSpec(specId: string): void {
  postMessage({ type: 'openSpec', specId });
}

export function openTicket(ticketId: string): void {
  postMessage({ type: 'openTicket', ticketId });
}

export function viewVerification(verificationId: string): void {
  postMessage({ type: 'viewVerification', verificationId });
}

export function refresh(): void {
  postMessage({ type: 'refresh' });
}

export function setupMessageListener(
  onExecutionData: (data: ExecutionData) => void,
  onActionSuccess: (action: string, message?: string) => void,
  onActionError: (message: string) => void,
  onError: (message: string) => void,
  onRefresh: () => void
): () => void {
  const handler = (event: MessageEvent<ViewResponseMessage>) => {
    const message = event.data;

    switch (message.type) {
      case 'executionDataResponse':
        onExecutionData(message.data);
        break;
      case 'actionSuccess':
        onActionSuccess(message.action, message.message);
        break;
      case 'actionError':
        onActionError(message.message);
        break;
      case 'error':
        onError(message.message);
        break;
      case 'refresh':
        onRefresh();
        break;
    }
  };

  window.addEventListener('message', handler);

  return () => {
    window.removeEventListener('message', handler);
  };
}
