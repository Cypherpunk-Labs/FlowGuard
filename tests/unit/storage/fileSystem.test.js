"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const path = __importStar(require("path"));
const fileSystem_1 = require("../../src/core/storage/fileSystem");
(0, vitest_1.describe)('FileSystem Utilities', () => {
    const testDir = '/tmp/test-flowguard';
    const testFile = path.join(testDir, 'test-file.txt');
    const testContent = 'Test file content';
    (0, vitest_1.beforeEach)(async () => {
        await (0, fileSystem_1.ensureDirectory)(testDir);
        await (0, fileSystem_1.writeFile)(testFile, testContent);
    });
    (0, vitest_1.afterEach)(async () => {
        try {
            await (0, fileSystem_1.deleteFile)(testFile);
            const { rm } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await rm(testDir, { recursive: true, force: true });
        }
        catch {
        }
    });
    (0, vitest_1.describe)('fileExists', () => {
        (0, vitest_1.it)('should return true for existing file', async () => {
            const exists = await (0, fileSystem_1.fileExists)(testFile);
            (0, vitest_1.expect)(exists).toBe(true);
        });
        (0, vitest_1.it)('should return false for non-existing file', async () => {
            const exists = await (0, fileSystem_1.fileExists)('/tmp/non-existing-file.txt');
            (0, vitest_1.expect)(exists).toBe(false);
        });
        (0, vitest_1.it)('should return false for directory', async () => {
            const exists = await (0, fileSystem_1.fileExists)(testDir);
            (0, vitest_1.expect)(exists).toBe(false);
        });
    });
    (0, vitest_1.describe)('readFile', () => {
        (0, vitest_1.it)('should read file content correctly', async () => {
            const content = await (0, fileSystem_1.readFile)(testFile);
            (0, vitest_1.expect)(content).toBe(testContent);
        });
        (0, vitest_1.it)('should throw error for non-existing file', async () => {
            await (0, vitest_1.expect)((0, fileSystem_1.readFile)('/tmp/non-existing-file.txt')).rejects.toThrow();
        });
    });
    (0, vitest_1.describe)('writeFile', () => {
        (0, vitest_1.it)('should write content to file', async () => {
            const newContent = 'New content';
            await (0, fileSystem_1.writeFile)(testFile, newContent);
            const content = await (0, fileSystem_1.readFile)(testFile);
            (0, vitest_1.expect)(content).toBe(newContent);
        });
        (0, vitest_1.it)('should create file in new directory', async () => {
            const newFile = path.join(testDir, 'subdir', 'new-file.txt');
            const newContent = 'New file content';
            await (0, fileSystem_1.writeFile)(newFile, newContent);
            const content = await (0, fileSystem_1.readFile)(newFile);
            (0, vitest_1.expect)(content).toBe(newContent);
        });
    });
    (0, vitest_1.describe)('listFiles', () => {
        (0, vitest_1.it)('should list files in directory', async () => {
            await (0, fileSystem_1.writeFile)(path.join(testDir, 'file1.txt'), 'content1');
            await (0, fileSystem_1.writeFile)(path.join(testDir, 'file2.txt'), 'content2');
            const files = await (0, fileSystem_1.listFiles)(testDir);
            (0, vitest_1.expect)(files.length).toBeGreaterThanOrEqual(2);
        });
        (0, vitest_1.it)('should filter files by regex pattern', async () => {
            await (0, fileSystem_1.writeFile)(path.join(testDir, 'test-1.ts'), 'content');
            await (0, fileSystem_1.writeFile)(path.join(testDir, 'test-2.ts'), 'content');
            await (0, fileSystem_1.writeFile)(path.join(testDir, 'other.txt'), 'content');
            const files = await (0, fileSystem_1.listFiles)(testDir, /\.ts$/);
            (0, vitest_1.expect)(files.every(f => f.endsWith('.ts'))).toBe(true);
        });
        (0, vitest_1.it)('should return empty array for non-existing directory', async () => {
            const files = await (0, fileSystem_1.listFiles)('/tmp/non-existing-dir');
            (0, vitest_1.expect)(files).toEqual([]);
        });
    });
    (0, vitest_1.describe)('deleteFile', () => {
        (0, vitest_1.it)('should delete existing file', async () => {
            const fileToDelete = path.join(testDir, 'to-delete.txt');
            await (0, fileSystem_1.writeFile)(fileToDelete, 'content');
            (0, vitest_1.expect)(await (0, fileSystem_1.fileExists)(fileToDelete)).toBe(true);
            await (0, fileSystem_1.deleteFile)(fileToDelete);
            (0, vitest_1.expect)(await (0, fileSystem_1.fileExists)(fileToDelete)).toBe(false);
        });
        (0, vitest_1.it)('should throw error for non-existing file', async () => {
            await (0, vitest_1.expect)((0, fileSystem_1.deleteFile)('/tmp/non-existing-file.txt')).rejects.toThrow();
        });
    });
    (0, vitest_1.describe)('ensureDirectory', () => {
        (0, vitest_1.it)('should create nested directories', async () => {
            const nestedDir = path.join(testDir, 'level1', 'level2', 'level3');
            await (0, fileSystem_1.ensureDirectory)(nestedDir);
            (0, vitest_1.expect)(await (0, fileSystem_1.fileExists)(nestedDir)).toBe(false);
        });
        (0, vitest_1.it)('should not throw for existing directory', async () => {
            await (0, vitest_1.expect)((0, fileSystem_1.ensureDirectory)(testDir)).resolves.not.toThrow();
        });
    });
});
//# sourceMappingURL=fileSystem.test.js.map