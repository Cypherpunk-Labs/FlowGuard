# FlowGuard Test Plan

A human-readable checklist for testing FlowGuard VS Code extension features.

## Prerequisites

- VS Code installed (version 1.80+)
- Node.js 18+ for running tests
- An OpenAI or Anthropic API key (optional - basic features work without it)
- A test workspace with code to manage

---

## 1. Extension Installation & Activation

### 1.1 Build and Package
- [ ] Run `npm install` successfully
- [ ] Run `npm run compile` successfully (no webpack errors)
- [ ] Extension compiles without critical warnings

### 1.2 Activation
- [ ] Extension activates without errors
- [ ] "FlowGuard initialized successfully" message appears in output
- [ ] Welcome message shown (if enabled in settings)

### 1.3 Sidebar Appears
- [ ] FlowGuard icon appears in activity bar
- [ ] FlowGuard sidebar view is visible
- [ ] "No epic initialized" welcome message shown

---

## 2. Epic Initialization

### 2.1 Create New Epic
- [ ] Click "Initialize Epic" button in sidebar
- [ ] Input dialog appears for epic title
- [ ] Enter a test epic title (e.g., "Test Feature Implementation")
- [ ] `.flowguard/` folder is created in workspace
- [ ] `epic.json` file is created with correct structure
- [ ] Sidebar refreshes and shows epic content

### 2.2 Epic Metadata
- [ ] Epic appears in sidebar with correct title
- [ ] Epic status shows as "in_progress"
- [ ] Epic shows correct creation date

---

## 3. Specification Management

### 3.1 Create Specification
- [ ] Click "Create Specification" button in sidebar (or `Cmd+Shift+D`)
- [ ] Input dialog appears for spec description
- [ ] Enter a test feature description
- [ ] Clarification questions appear (1-3 questions max)
- [ ] Answer clarifying questions
- [ ] Spec is generated and saved to `.flowguard/specs/spec-*.md`
- [ ] Spec appears in sidebar under "Specs"

### 3.2 Spec Editor
- [ ] Open a spec file from sidebar
- [ ] Custom spec editor opens (not regular markdown editor)
- [ ] Frontmatter is visible and editable
- [ ] Markdown content displays correctly
- [ ] Edit spec title, save changes
- [ ] Changes persist after reopening

### 3.3 Spec Approval
- [ ] "Approve Spec" command available (`Cmd+Shift+A` in spec file)
- [ ] Click approve, status changes to "approved"
- [ ] Approved specs show checkmark in sidebar

---

## 4. Ticket Management

### 4.1 Create Ticket
- [ ] Select a spec in sidebar
- [ ] Click "New Ticket" button (or `Cmd+Shift+T`)
- [ ] Ticket is generated from spec
- [ ] Ticket appears in sidebar under "Tickets"
- [ ] Ticket contains acceptance criteria
- [ ] Ticket links to parent spec

### 4.2 Ticket Editor
- [ ] Open a ticket file from sidebar
- [ ] Custom ticket editor opens
- [ ] Frontmatter (id, status, priority, assignee) is editable
- [ ] Markdown content displays correctly
- [ ] Edit ticket priority, save changes
- [ ] Changes persist after reopening

### 4.3 Navigation
- [ ] "Go to Spec" command works from ticket file (`Cmd+Shift+G S`)
- [ ] "Go to Ticket" command works from spec file (`Cmd+Shift+G T`)
- [ ] Correct artifact opens on navigation

---

## 5. Codebase Analysis

### 5.1 Codebase Explorer
- [ ] Sidebar shows "Codebase" section
- [ ] File tree displays relevant source files
- [ ] Configuration exclusions work (node_modules filtered out)
- [ ] Configuration inclusions work (correct file types shown)

### 5.2 Context Analysis
- [ ] Spec generator uses codebase context
- [ ] Ticket generator references existing code
- [ ] File links in specs/tickets are clickable
- [ ] Clicking file link opens correct file

---

## 6. Handoff System

### 6.1 Generate Handoff
- [ ] Select an epic or ticket in sidebar
- [ ] Click "Generate Handoff" (or `Cmd+Shift+H`)
- [ ] Handoff document is generated
- [ ] Document includes spec content
- [ ] Document includes tickets
- [ ] Document includes acceptance criteria

### 6.2 Agent Templates
- [ ] Handoff includes agent selector (Cursor, Claude, Windsurf, Cline, Aider)
- [ ] Different agents produce different formatting
- [ ] Template variables are correctly substituted

### 6.3 Copy to Clipboard
- [ ] "Copy Handoff to Clipboard" command works
- [ ] Content is properly formatted in clipboard
- [ ] Can paste into external tool (Cursor, Claude, etc.)

### 6.4 Preview Handoff
- [ ] "Preview Handoff" command works
- [ ] Preview shows formatted markdown
- [ ] Preview includes all expected sections

---

## 7. Verification System

### 7.1 Verify Changes
- [ ] Make changes to files in workspace
- [ ] Click "Verify Changes" (or `Cmd+Shift+K`)
- [ ] Verification process runs
- [ ] Results appear in Verification view
- [ ] Verification shows spec alignment status

### 7.2 Verify Current File
- [ ] Open a file with changes
- [ ] Run "Verify Current File" (`Cmd+Alt+V`)
- [ ] Verification analyzes current file
- [ ] Results show relevant issues

### 7.3 Verify Commit
- [ ] Make a git commit with changes
- [ ] Run "Verify Commit" command
- [ ] Verification compares against spec
- [ ] Results show commit-spec alignment

### 7.4 Verification Results
- [ ] Verification view shows severity levels (Critical, High, Medium, Low)
- [ ] Issues are categorized correctly
- [ ] Auto-fixable issues have fix button
- [ ] Non-fixable issues show description

---

## 8. Execution Tracking

### 8.1 Execution View
- [ ] Execution Tracking view is available
- [ ] Shows handoff history
- [ ] Displays execution status (pending, in_progress, completed)

### 8.2 Track Executions
- [ ] Create a handoff
- [ ] Record execution start
- [ ] Update execution status
- [ ] Execution shows completion time
- [ ] Executions link to original handoff

---

## 9. Plugin System

### 9.1 Plugin Management
- [ ] "List Plugins" command shows loaded plugins
- [ ] Plugins directory is scanned (`.flowguard/plugins/`)
- [ ] Plugin count matches expectations
- [ ] Plugin status shows correctly

### 9.2 Plugin Loading
- [ ] Plugins load without errors
- [ ] Plugin templates are available
- [ ] Plugin diagram types are registered
- [ ] Plugin agent integrations work

### 9.3 Plugin Commands
- [ ] "Reload Plugin" command works
- [ ] "Install Plugin" command available (future)
- [ ] "Uninstall Plugin" command available (future)

---

## 10. Tutorial System

### 10.1 First Epic Tutorial
- [ ] "Start Tutorial" command shows tutorial options
- [ ] First Epic Tutorial is available
- [ ] Tutorial guides through epic creation
- [ ] Tutorial completion is tracked

### 10.2 Verification Tutorial
- [ ] Verification Tutorial is available
- [ ] Tutorial explains verification concepts
- [ ] Tutorial demonstrates verification workflow

### 10.3 Handoff Tutorial
- [ ] Handoff Tutorial is available
- [ ] Tutorial explains handoff process
- [ ] Tutorial demonstrates agent handoff

---

## 11. Configuration

### 11.1 LLM Settings
- [ ] Settings show LLM provider options (OpenAI, Anthropic, Local, OpenRouter, OpenCode)
- [ ] Model configuration is saved
- [ ] Temperature setting works
- [ ] Max tokens setting works
- [ ] API key can be entered via command

### 11.2 Template Settings
- [ ] Default agent template setting works
- [ ] Custom template path setting works
- [ ] Codebase context inclusion setting works
- [ ] Max files setting works

### 11.3 Editor Settings
- [ ] Auto-save toggle works
- [ ] Auto-save delay works
- [ ] Diagram preview toggle works

### 11.4 Verification Settings
- [ ] Auto-verify on save toggle works
- [ ] Minimum severity filter works
- [ ] Auto-fix enable/disable works

---

## 12. Output & Logging

### 12.1 Output Channel
- [ ] FlowGuard output channel is created
- [ ] Log messages appear with correct levels (DEBUG, INFO, WARN, ERROR)
- [ ] Log level setting affects output
- [ ] Welcome message appears when enabled

### 12.2 Error Handling
- [ ] Errors show in output channel
- [ ] Error messages are descriptive
- [ ] Configuration errors are reported

---

## 13. Keyboard Shortcuts

### 13.1 Core Shortcuts
- [ ] `Cmd+Shift+O` - Create Epic
- [ ] `Cmd+Shift+D` - Create Spec
- [ ] `Cmd+Shift+T` - Create Ticket
- [ ] `Cmd+Shift+H` - Generate Handoff
- [ ] `Cmd+Shift+K` - Verify Changes
- [ ] `Cmd+Shift+V` - Show Verification
- [ ] `Cmd+Shift+X` - Show Execution

### 13.2 Context Shortcuts
- [ ] `Cmd+Alt+V` - Verify Current File (when editor focused)
- [ ] `Cmd+Alt+S` - Open Spec
- [ ] `Cmd+Alt+T` - Open Ticket
- [ ] `Cmd+Shift+R` - Refresh Sidebar
- [ ] `Cmd+Shift+A` - Approve Spec (in spec file)
- [ ] `Cmd+Shift+G S` - Go to Spec (in ticket file)
- [ ] `Cmd+Shift+G T` - Go to Ticket (in spec file)

---

## 14. Editor Integration

### 14.1 Context Menu
- [ ] "Verify Current File" in editor context menu
- [ ] "Approve Spec" in spec file context menu
- [ ] "Go to Spec" in ticket file context menu
- [ ] "Go to Ticket" in spec file context menu

### 14.2 Explorer Context Menu
- [ ] "Verify Changes" in explorer context menu (for `.flowguard/` folder)

---

## 15. Data Persistence

### 15.1 Local Storage
- [ ] All artifacts saved to `.flowguard/` folder
- [ ] Specs saved as `spec-*.md` files
- [ ] Tickets saved as `ticket-*.md` files
- [ ] Verifications saved as `verification-*.md` files
- [ ] Executions saved as `execution-*.md` files

### 15.2 Git Integration
- [ ] Git helper tracks changes
- [ ] Verification compares against git diff
- [ ] Commit integration works

---

## 16. UI Components

### 16.1 Sidebar Layout
- [ ] Epic selector works
- [ ] Specs list is scrollable
- [ ] Tickets list is scrollable
- [ ] Executions list is scrollable
- [ ] Codebase section is expandable

### 16.2 Webview Components
- [ ] Sidebar webview loads without errors
- [ ] Spec editor webview loads
- [ ] Ticket editor webview loads
- [ ] Verification view webview loads
- [ ] Execution view webview loads

### 16.3 Diagrams
- [ ] Mermaid diagrams render in specs
- [ ] Custom diagram types from plugins work
- [ ] Diagram preview is toggleable

---

## 17. Offline/Low-Level Features

### 17.1 Without API Key
- [ ] Extension activates without API key
- [ ] Epic creation works offline
- [ ] Spec viewing works offline
- [ ] Ticket viewing works offline
- [ ] Some features show "requires API key" message

### 17.2 Local LLM Provider
- [ ] Local provider can be selected
- [ ] Base URL setting works
- [ ] Local provider attempts connection

---

## 18. Performance

### 18.1 Startup Time
- [ ] Extension activates within 5 seconds
- [ ] Sidebar loads within 3 seconds
- [ ] Spec list renders within 2 seconds

### 18.2 Large Workspaces
- [ ] File scanning respects exclude patterns
- [ ] Incremental scan improves performance
- [ ] Max files setting prevents memory issues

---

## 19. Edge Cases

### 19.1 No Workspace
- [ ] Extension shows error when no workspace open
- [ ] No crash when closing workspace

### 19.2 Missing API Key
- [ ] Graceful degradation when API key missing
- [ ] Helpful message for LLM-dependent features

### 19.3 Malformed Files
- [ ] Frontmatter parsing handles malformed YAML
- [ ] Missing files handled gracefully

### 19.4 Concurrent Edits
- [ ] Auto-save prevents data loss
- [ ] Concurrent edits to same artifact handled

---

## 20. Integration Tests

### 20.1 End-to-End Workflow
- [ ] Initialize epic
- [ ] Create spec
- [ ] Approve spec
- [ ] Create ticket
- [ ] Generate handoff
- [ ] Make code changes
- [ ] Verify changes
- [ ] View verification results

### 20.2 Cross-Feature
- [ ] Spec approval enables handoff
- [ ] Ticket links persist across sessions
- [ ] Verification results link to original spec

---

## Test Status Summary

| Category | Total Tests | Passed | Failed | Not Tested |
|----------|-------------|--------|--------|------------|
| Extension Installation | 3 | | | |
| Epic Initialization | 6 | | | |
| Specification Management | 9 | | | |
| Ticket Management | 9 | | | |
| Codebase Analysis | 5 | | | |
| Handoff System | 9 | | | |
| Verification System | 11 | | | |
| Execution Tracking | 6 | | | |
| Plugin System | 6 | | | |
| Tutorial System | 6 | | | |
| Configuration | 12 | | | |
| Output & Logging | 4 | | | |
| Keyboard Shortcuts | 13 | | | |
| Editor Integration | 5 | | | |
| Data Persistence | 5 | | | |
| UI Components | 10 | | | |
| Offline Features | 5 | | | |
| Performance | 4 | | | |
| Edge Cases | 6 | | | |
| Integration Tests | 3 | | | |
| **TOTAL** | **138** | | | |

---

## Notes

- Run unit tests with: `npm run test:unit`
- Run integration tests with: `npm run test:integration`
- Run e2e tests with: `npm run test:e2e`
- Run all tests with: `npm run test:all`

### Known Issues (from test run)
- Some tests fail due to VS Code mock not available in Jest
- E2E tests require Playwright, not Jest
- Focus on manual testing for UI components

### Test Environment
- VS Code Version: [Fill in]
- OS: [macOS/Linux/Windows]
- Node Version: [Fill in]
- Extension Version: 0.1.0

---

## Test Completion Checklist

- [ ] All critical features tested
- [ ] All UI components verified
- [ ] All keyboard shortcuts tested
- [ ] All edge cases covered
- [ ] Integration workflow completed
- [ ] Performance acceptable
- [ ] No crashes during testing
- [ ] Known issues documented
