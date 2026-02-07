import { jest, beforeEach, afterEach } from '@jest/globals';

jest.mock('vscode', () => ({
  workspace: {
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      has: jest.fn(),
      update: jest.fn()
    })),
    workspaceFolders: [],
    asRelativePath: jest.fn(),
    fs: {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      stat: jest.fn(),
      readDirectory: jest.fn(),
      createDirectory: jest.fn(),
      delete: jest.fn(),
      rename: jest.fn(),
      copy: jest.fn()
    }
  },
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInputBox: jest.fn(),
    showQuickPick: jest.fn(),
    createWebviewPanel: jest.fn(),
    registerWebviewViewProvider: jest.fn(),
    createStatusBarItem: jest.fn(),
    withProgress: jest.fn()
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn()
  },
  env: {
    clipboard: {
      writeText: jest.fn()
    },
    shell: {
      openExternal: jest.fn()
    }
  },
  Uri: {
    file: jest.fn(),
    parse: jest.fn(),
    joinPath: jest.fn()
  },
  EventEmitter: jest.fn(),
  Disposable: {
    from: jest.fn()
  },
  TreeItem: class {},
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  }
}), { virtual: true });

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
