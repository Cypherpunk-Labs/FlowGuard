// VS Code API bridge for the webview
import type { RequestMessage, ResponseMessage } from '../types';

interface VSCodeApi {
  postMessage(message: RequestMessage): void;
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

export function postMessage(message: RequestMessage): void {
  getVscodeApi().postMessage(message);
}

export function getSpecs(): void {
  postMessage({ type: 'getSpecs' });
}

export function getTickets(specId?: string): void {
  postMessage({ type: 'getTickets', specId });
}

export function getExecutions(): void {
  postMessage({ type: 'getExecutions' });
}

export function openArtifact(artifactType: 'spec' | 'ticket' | 'execution', id: string): void {
  postMessage({ type: 'openArtifact', artifactType, id });
}

export function createSpec(): void {
  postMessage({ type: 'createSpec' });
}

export function createTicket(specId?: string): void {
  postMessage({ type: 'createTicket', specId });
}

export function refresh(): void {
  postMessage({ type: 'refresh' });
}

export function setupMessageListener(
  onSpecsResponse: (data: any[]) => void,
  onTicketsResponse: (data: any[]) => void,
  onExecutionsResponse: (data: any[]) => void,
  onError: (message: string) => void,
  onRefresh: () => void
): () => void {
  const handler = (event: MessageEvent<ResponseMessage>) => {
    const message = event.data;
    
    switch (message.type) {
      case 'specsResponse':
        onSpecsResponse(message.data);
        break;
      case 'ticketsResponse':
        onTicketsResponse(message.data);
        break;
      case 'executionsResponse':
        onExecutionsResponse(message.data);
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
