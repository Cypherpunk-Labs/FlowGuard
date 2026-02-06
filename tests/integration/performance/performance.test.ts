import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { FileScanner } from '../../../src/planning/codebase/FileScanner';

interface BenchmarkResult {
  name: string;
  duration: number;
  target: number;
  passed: boolean;
}

suite('Performance Benchmarks', () => {
  const testWorkspacePath = path.resolve(__dirname, '../../../test-workspace');
  let tempWorkspacePath: string;

  setup(() => {
    tempWorkspacePath = path.join(testWorkspacePath, 'temp-perf-test');
    fs.mkdirSync(tempWorkspacePath, { recursive: true });
  });

  teardown(() => {
    if (fs.existsSync(tempWorkspacePath)) {
      fs.rmSync(tempWorkspacePath, { recursive: true, force: true });
    }
  });

  function generateTestFiles(fileCount: number): void {
    const srcDir = path.join(tempWorkspacePath, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    
    for (let i = 0; i < fileCount; i++) {
      const fileName = `file${i.toString().padStart(3, '0')}.ts`;
      const filePath = path.join(srcDir, fileName);
      const content = `export function function${i}() { return ${i}; }`;
      fs.writeFileSync(filePath, content);
    }
  }

  async function measureCodebaseScan(fileCount: number): Promise<BenchmarkResult> {
    generateTestFiles(fileCount);
    
    const fileScanner = new FileScanner(tempWorkspacePath);
    
    const start = performance.now();
    const files = await fileScanner.scanWorkspace();
    const end = performance.now();
    
    const duration = end - start;
    
    return {
      name: `Codebase Scan (${fileCount} files)`,
      duration,
      target: fileCount <= 100 ? 5000 : 5000,
      passed: duration < 5000
    };
  }

  test('extension activation should complete within 500ms', async function() {
    this.timeout(10000);
    
    const start = performance.now();
    await vscode.extensions.getExtension('mkemp.flowguard')?.activate();
    const end = performance.now();
    
    const duration = end - start;
    
    console.log(`Extension activation took ${duration.toFixed(2)}ms`);
    
    assert.strictEqual(duration < 500, true, 
      `Extension activation took ${duration.toFixed(2)}ms, exceeding target of 500ms`
    );
  });

  test('codebase scan of 10 files should complete within 5s', async function() {
    this.timeout(30000);
    
    const result = await measureCodebaseScan(10);
    
    console.log(`Codebase scan took ${result.duration.toFixed(2)}ms`);
    
    assert.strictEqual(result.passed, true,
      `Codebase scan took ${result.duration.toFixed(2)}ms, exceeding target of ${result.target}ms`
    );
  });

  test('codebase scan of 50 files should complete within 5s', async function() {
    this.timeout(30000);
    
    const result = await measureCodebaseScan(50);
    
    console.log(`Codebase scan took ${result.duration.toFixed(2)}ms`);
    
    assert.strictEqual(result.passed, true,
      `Codebase scan took ${result.duration.toFixed(2)}ms, exceeding target of ${result.target}ms`
    );
  });

  test('codebase scan of 100 files should complete within 5s', async function() {
    this.timeout(30000);
    
    const result = await measureCodebaseScan(100);
    
    console.log(`Codebase scan took ${result.duration.toFixed(2)}ms`);
    
    assert.strictEqual(result.passed, true,
      `Codebase scan took ${result.duration.toFixed(2)}ms, exceeding target of ${result.target}ms`
    );
  });
});
