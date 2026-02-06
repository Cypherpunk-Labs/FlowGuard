import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { ArtifactStorage } from '../../../src/core/storage/ArtifactStorage';
import { GitHelper } from '../../../src/core/git/GitHelper';
import { Spec } from '../../../src/core/models/Spec';
import { v4 as uuidv4 } from 'uuid';

suite('Epic Creation Workflow Test', () => {
  let storage: ArtifactStorage;
  let gitHelper: GitHelper;
  const testWorkspacePath = path.resolve(__dirname, '../../../test-workspace');

  setup(async () => {
    storage = new ArtifactStorage(testWorkspacePath);
    gitHelper = new GitHelper(testWorkspacePath);
    await storage.initialize();
  });

  test('should initialize .flowguard/ directory structure', async () => {
    const flowguardPath = path.join(testWorkspacePath, '.flowguard');
    const specsPath = path.join(flowguardPath, 'specs');
    const ticketsPath = path.join(flowguardPath, 'tickets');
    const executionsPath = path.join(flowguardPath, 'executions');
    const verificationsPath = path.join(flowguardPath, 'verifications');
    const templatesPath = path.join(flowguardPath, 'templates');

    const fs = vscode.workspace.fs;
    
    assert.strictEqual(await fileExists(fs, flowguardPath), true, '.flowguard/ directory should exist');
    assert.strictEqual(await fileExists(fs, specsPath), true, 'specs/ directory should exist');
    assert.strictEqual(await fileExists(fs, ticketsPath), true, 'tickets/ directory should exist');
    assert.strictEqual(await fileExists(fs, executionsPath), true, 'executions/ directory should exist');
    assert.strictEqual(await fileExists(fs, verificationsPath), true, 'verifications/ directory should exist');
    assert.strictEqual(await fileExists(fs, templatesPath), true, 'templates/ directory should exist');
  });

  test('should create epic.json metadata file', async () => {
    const epicId = uuidv4();
    const epicMetadata = {
      id: epicId,
      title: 'Test Epic',
      description: 'Test epic description',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['test'],
      specIds: [],
      ticketIds: []
    };

    const epicPath = path.join(testWorkspacePath, '.flowguard', 'epic.json');
    const fs = vscode.workspace.fs;
    
    await fs.writeFile(
      vscode.Uri.file(epicPath),
      Buffer.from(JSON.stringify(epicMetadata, null, 2))
    );

    const content = await fs.readFile(vscode.Uri.file(epicPath));
    const savedEpic = JSON.parse(content.toString());
    
    assert.strictEqual(savedEpic.id, epicId);
    assert.strictEqual(savedEpic.title, 'Test Epic');
    assert.strictEqual(savedEpic.status, 'active');
    assert.ok(savedEpic.createdAt);
  });

  test('should verify directory structure matches expected layout', async () => {
    const flowguardPath = path.join(testWorkspacePath, '.flowguard');
    const fs = vscode.workspace.fs;
    
    const expectedDirs = ['specs', 'tickets', 'executions', 'verifications', 'templates'];
    
    for (const dir of expectedDirs) {
      const dirPath = path.join(flowguardPath, dir);
      const stat = await fs.stat(vscode.Uri.file(dirPath));
      assert.strictEqual(stat.type, vscode.FileType.Directory, `${dir} should be a directory`);
    }
  });

  test('should create spec with correct metadata', async () => {
    const spec: Spec = {
      id: uuidv4(),
      epicId: 'test-epic',
      title: 'Test Spec',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      author: 'Test User',
      tags: ['test'],
      content: '## Overview\n\nTest content'
    };

    await storage.saveSpec(spec);
    const loadedSpec = await storage.loadSpec(spec.id);
    
    assert.strictEqual(loadedSpec.id, spec.id);
    assert.strictEqual(loadedSpec.title, spec.title);
    assert.strictEqual(loadedSpec.status, spec.status);
    assert.ok(loadedSpec.createdAt instanceof Date);
  });

  test('should stage files in Git', async () => {
    const isRepo = await gitHelper.isGitRepository();
    
    if (isRepo) {
      const testFile = path.join(testWorkspacePath, '.flowguard', 'test.txt');
      const fs = vscode.workspace.fs;
      await fs.writeFile(vscode.Uri.file(testFile), Buffer.from('test content'));
      
      await gitHelper.stageFlowGuardArtifact(testFile);
      const status = await gitHelper.getStatus();
      
      const isStaged = status.staged.some((file: string) => file.includes('test.txt'));
      assert.ok(isStaged || status.staged.length > 0, 'Files should be staged');
      
      await fs.delete(vscode.Uri.file(testFile));
    } else {
      console.log('Skipping Git test - not a git repository');
    }
  });
});

async function fileExists(fs: typeof vscode.workspace.fs, filePath: string): Promise<boolean> {
  try {
    await fs.stat(vscode.Uri.file(filePath));
    return true;
  } catch {
    return false;
  }
}
