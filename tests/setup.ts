import { vi, beforeEach, afterEach } from 'vitest';

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn(),
    workspaceFolders: [],
    asRelativePath: vi.fn(),
    fs: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      stat: vi.fn(),
      readDirectory: vi.fn(),
      createDirectory: vi.fn(),
      delete: vi.fn(),
      rename: vi.fn(),
      copy: vi.fn()
    }
  },
  window: {
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInputBox: vi.fn(),
    showQuickPick: vi.fn(),
    createWebviewPanel: vi.fn(),
    registerWebviewViewProvider: vi.fn(),
    createStatusBarItem: vi.fn(),
    withProgress: vi.fn()
  },
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn()
  },
  env: {
    clipboard: {
      writeText: vi.fn()
    },
    shell: {
      openExternal: vi.fn()
    }
  },
  Uri: {
    file: vi.fn(),
    parse: vi.fn(),
    joinPath: vi.fn()
  },
  EventEmitter: vi.fn(),
  Disposable: {
    from: vi.fn()
  },
  TreeItem: class {},
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
});
