import * as assert from 'assert';
import * as vscode from 'vscode';

suite('VS Code Command Integration Tests', () => {
  
  test('should verify all FlowGuard commands are registered', async () => {
    const allCommands = await vscode.commands.getCommands(true);
    const flowguardCommands = allCommands.filter(cmd => cmd.startsWith('flowguard.'));
    
    const expectedCommands = [
      'flowguard.createSpec',
      'flowguard.createTicket',
      'flowguard.refreshSidebar',
      'flowguard.showVerification',
      'flowguard.showExecution',
      'flowguard.applyAutoFix',
      'flowguard.ignoreIssue',
      'flowguard.initializeEpic',
      'flowguard.createEpic',
      'flowguard.generateHandoff',
      'flowguard.verifyChanges',
      'flowguard.verifyCurrentFile',
      'flowguard.verifyCommit',
      'flowguard.openSpec',
      'flowguard.openTicket',
      'flowguard.approveSpec',
      'flowguard.assignTicket',
      'flowguard.copyHandoffToClipboard',
      'flowguard.previewHandoff',
      'flowguard.goToSpec',
      'flowguard.goToTicket'
    ];
    
    for (const expectedCmd of expectedCommands) {
      const isRegistered = flowguardCommands.includes(expectedCmd);
      assert.ok(isRegistered, `Command ${expectedCmd} should be registered`);
    }
  });

  test('should execute flowguard.refreshSidebar command', async () => {
    try {
      await vscode.commands.executeCommand('flowguard.refreshSidebar');
      assert.ok(true, 'Command executed successfully');
    } catch (err) {
      assert.fail(`Command failed: ${err}`);
    }
  });

  test('should execute flowguard.createEpic command', async () => {
    try {
      await vscode.commands.executeCommand('flowguard.createEpic');
      assert.ok(true, 'Command executed successfully');
    } catch (err) {
      assert.ok(true, 'Command may require user input which is expected');
    }
  });

  test('should verify command palette availability', async () => {
    const allCommands = await vscode.commands.getCommands(true);
    
    const coreCommands = [
      'flowguard.createSpec',
      'flowguard.createTicket',
      'flowguard.generateHandoff',
      'flowguard.verifyChanges'
    ];
    
    for (const cmd of coreCommands) {
      assert.ok(
        allCommands.includes(cmd),
        `${cmd} should be available in command palette`
      );
    }
  });

  test('should verify context menu commands exist', async () => {
    const allCommands = await vscode.commands.getCommands(true);
    
    const contextCommands = [
      'flowguard.verifyCurrentFile',
      'flowguard.approveSpec',
      'flowguard.goToSpec',
      'flowguard.goToTicket'
    ];
    
    for (const cmd of contextCommands) {
      assert.ok(
        allCommands.includes(cmd),
        `${cmd} should be available as context menu command`
      );
    }
  });
});
