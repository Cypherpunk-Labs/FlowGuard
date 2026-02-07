"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('vscode', () => ({
    workspace: {
        getConfiguration: vitest_1.vi.fn(),
        workspaceFolders: [],
        asRelativePath: vitest_1.vi.fn(),
        fs: {
            readFile: vitest_1.vi.fn(),
            writeFile: vitest_1.vi.fn(),
            stat: vitest_1.vi.fn(),
            readDirectory: vitest_1.vi.fn(),
            createDirectory: vitest_1.vi.fn(),
            delete: vitest_1.vi.fn(),
            rename: vitest_1.vi.fn(),
            copy: vitest_1.vi.fn()
        }
    },
    window: {
        showInformationMessage: vitest_1.vi.fn(),
        showErrorMessage: vitest_1.vi.fn(),
        showWarningMessage: vitest_1.vi.fn(),
        showInputBox: vitest_1.vi.fn(),
        showQuickPick: vitest_1.vi.fn(),
        createWebviewPanel: vitest_1.vi.fn(),
        registerWebviewViewProvider: vitest_1.vi.fn(),
        createStatusBarItem: vitest_1.vi.fn(),
        withProgress: vitest_1.vi.fn()
    },
    commands: {
        registerCommand: vitest_1.vi.fn(),
        executeCommand: vitest_1.vi.fn()
    },
    env: {
        clipboard: {
            writeText: vitest_1.vi.fn()
        },
        shell: {
            openExternal: vitest_1.vi.fn()
        }
    },
    Uri: {
        file: vitest_1.vi.fn(),
        parse: vitest_1.vi.fn(),
        joinPath: vitest_1.vi.fn()
    },
    EventEmitter: vitest_1.vi.fn(),
    Disposable: {
        from: vitest_1.vi.fn()
    },
    TreeItem: class {
    },
    TreeItemCollapsibleState: {
        None: 0,
        Collapsed: 1,
        Expanded: 2
    }
}));
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.clearAllMocks();
});
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.resetAllMocks();
});
//# sourceMappingURL=setup.js.map