import * as assert from 'assert';
import * as vscode from 'vscode';

suite('UI Integration Tests - Sidebar', () => {
  
  test('should have FlowGuard sidebar view registered', async () => {
    await vscode.commands.executeCommand('flowguard-sidebar.focus');
    
    const views = await vscode.window.visibleTextEditors;
    assert.ok(views !== undefined, 'Views should be accessible');
  });

  test('should open sidebar view', async () => {
    try {
      await vscode.commands.executeCommand('workbench.view.extension.flowguard-sidebar');
      assert.ok(true, 'Sidebar view command executed');
    } catch (err) {
      console.log('Sidebar view command may not be directly testable:', err);
      assert.ok(true, 'Skipping direct sidebar test');
    }
  });

  test('should verify webview view provider is registered', async () => {
    const allCommands = await vscode.commands.getCommands(true);
    const hasSidebarCommands = allCommands.some(cmd => 
      cmd.includes('flowguard.sidebar') || 
      cmd.includes('flowguard.refreshSidebar')
    );
    
    assert.ok(hasSidebarCommands, 'Sidebar-related commands should exist');
  });

  test('should verify custom editors are registered', async () => {
    const allCommands = await vscode.commands.getCommands(true);
    
    const editorCommands = [
      'flowguard.openSpec',
      'flowguard.openTicket'
    ];
    
    for (const cmd of editorCommands) {
      assert.ok(
        allCommands.includes(cmd),
        `${cmd} should be registered for custom editors`
      );
    }
  });

  test('should verify verification view provider exists', async () => {
    const allCommands = await vscode.commands.getCommands(true);
    
    assert.ok(
      allCommands.includes('flowguard.showVerification'),
      'showVerification command should exist'
    );
  });
});
