import type { ViewRequestMessage, ViewResponseMessage, VerificationData } from '../types';

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

export function getVerification(verificationId: string): void {
  postMessage({ type: 'getVerification', verificationId });
}

export function applyAutoFix(verificationId: string, issueId: string): void {
  postMessage({ type: 'applyAutoFix', verificationId, issueId });
}

export function ignoreIssue(verificationId: string, issueId: string): void {
  postMessage({ type: 'ignoreIssue', verificationId, issueId });
}

export function approveVerification(verificationId: string, status: 'approved' | 'approved_with_conditions', comment?: string): void {
  postMessage({ type: 'approveVerification', verificationId, status, comment });
}

export function requestChanges(verificationId: string, comment: string): void {
  postMessage({ type: 'requestChanges', verificationId, comment });
}

export function openFile(filePath: string, lineNumber?: number): void {
  postMessage({ type: 'openFile', filePath, lineNumber });
}

export function refresh(): void {
  postMessage({ type: 'refresh' });
}

export function setupMessageListener(
  onVerificationData: (data: VerificationData) => void,
  onActionSuccess: (action: string, message?: string) => void,
  onActionError: (message: string) => void,
  onError: (message: string) => void,
  onRefresh: () => void
): () => void {
  const handler = (event: MessageEvent<ViewResponseMessage>) => {
    const message = event.data;

    switch (message.type) {
      case 'verificationDataResponse':
        onVerificationData(message.data);
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
