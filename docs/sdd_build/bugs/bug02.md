> flowguard@0.1.0 compile
> webpack --config webpack.config.js --mode production && webpack --config webpack.webview.config.js --mode production

asset extension.js 4.53 MiB [emitted] [minimized] (name: main) 2 related assets
orphan modules 9.95 KiB [orphan] 18 modules
runtime modules 1.04 KiB 5 modules
modules by path ./node_modules/ 10.5 MiB
  cacheable modules 10.5 MiB 217 modules
  ./node_modules/typescript/lib/ sync 160 bytes [optional] [built] [code generated]
  ./node_modules/node-fetch/lib/index.mjs + 3 modules 44.3 KiB [not cacheable] [built] [code generated]
modules by path ./src/ 539 KiB
  cacheable modules 538 KiB 75 modules
  ./src/plugins/ sync 160 bytes [built] [code generated]
  ./src/planning/codebase/ sync 160 bytes [built] [code generated]
+ 22 modules

WARNING in ./src/planning/codebase/TreeSitterAnalyzer.ts 50:116-126
Critical dependency: the request of a dependency is an expression
 @ ./src/planning/codebase/CodebaseExplorer.ts 40:29-60
 @ ./src/planning/index.ts 32:25-63
 @ ./src/extension.ts 62:19-40

WARNING in ./src/plugins/PluginManager.ts 135:33-52
Critical dependency: the request of a dependency is an expression
 @ ./src/extension.ts 72:24-58

WARNING in ./src/plugins/PluginManager.ts 206:29-56
Critical dependency: the request of a dependency is an expression
 @ ./src/extension.ts 72:24-58

WARNING in ./node_modules/typescript/lib/typescript.js 8397:27-46
Critical dependency: the request of a dependency is an expression
 @ ./src/planning/codebase/TypeScriptAnalyzer.ts 37:24-45
 @ ./src/planning/codebase/CodebaseExplorer.ts 39:29-60
 @ ./src/planning/index.ts 32:25-63
 @ ./src/extension.ts 62:19-40

4 warnings have detailed information that is not shown.
Use 'stats.errorDetails: true' resp. '--stats-error-details' to show it.

webpack 5.105.0 compiled with 4 warnings in 16224 ms

WARNING: You should add "svelte" to the "resolve.conditionNames" array in your webpack config. See https://github.com/sveltejs/svelte-loader#resolveconditionnames for more information

assets by status 283 KiB [cached] 6 assets
orphan modules 404 KiB [orphan] 56 modules
runtime modules 5.24 KiB 26 modules
cacheable modules 1020 KiB
  modules by path ./src/ui/ 1010 KiB
    modules by path ./src/ui/views/webview/ 370 KiB 7 modules
    modules by path ./src/ui/sidebar/webview/ 221 KiB 4 modules
    modules by path ./src/ui/editors/webview/ 420 KiB
      modules by path ./src/ui/editors/webview/*.ts 934 bytes 2 modules
      modules with warnings 419 KiB [true warnings] 2 modules
  modules by path ./node_modules/ 8.58 KiB
    modules by path ./node_modules/style-loader/dist/runtime/*.js 5.84 KiB 6 modules
    modules by path ./node_modules/css-loader/dist/runtime/*.js 2.74 KiB
      ./node_modules/css-loader/dist/runtime/sourceMaps.js 505 bytes [built] [code generated]
      ./node_modules/css-loader/dist/runtime/api.js 2.25 KiB [built] [code generated]

WARNING in ./src/ui/editors/webview/components/DiagramInserter.svelte 463:19-36
Module not found: Error: Can't resolve 'mermaid' in '/Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview/components'
 @ ./src/ui/editors/webview/SpecEditor.svelte 35:0-66 389:23-38
 @ ./src/ui/editors/webview/specEditorMain.ts

WARNING in ./src/ui/editors/webview/components/PreviewPanel.svelte 72:19-36
Module not found: Error: Can't resolve 'mermaid' in '/Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview/components'
 @ ./src/ui/editors/webview/SpecEditor.svelte 34:0-60 339:20-32
 @ ./src/ui/editors/webview/specEditorMain.ts

WARNING in ./src/ui/editors/webview/components/PreviewPanel.svelte
Module Warning (from ./node_modules/svelte-loader/index.js):
PreviewPanel has unused export property 'diagrams'. If it is for external reference only, please consider using `export const diagrams` (3:11)
1: <script lang="ts">import { afterUpdate } from 'svelte';
2: export let markdown = '';
3: export let diagrams = [];
              ^
4: let renderedHtml = '';
5: let previewContainer;
 @ ./src/ui/editors/webview/SpecEditor.svelte 34:0-60 339:20-32
 @ ./src/ui/editors/webview/specEditorMain.ts

WARNING in ./src/ui/sidebar/webview/components/ExecutionList.svelte
Module Warning (from ./node_modules/svelte-loader/index.js):
ExecutionList has unused export property 'specs'. If it is for external reference only, please consider using `export const specs` (4:11)
2: import { openArtifact } from '../vscode';
3: export let executions = [];
4: export let specs = [];
              ^
5: export let tickets = [];
6: function handleClick(executionId) {
 @ ./src/ui/sidebar/webview/App.svelte 32:0-62 489:21-34
 @ ./src/ui/sidebar/webview/main.ts

WARNING in ./src/ui/views/webview/ExecutionView.svelte 660:2-10
export 'openSpec' (imported as 'openSpec') was not found in './vscode' (possible exports: __esModule, applyAutoFix, approveVerification, getVerification, getVscodeApi, ignoreIssue, openFile, postMessage, refresh, requestChanges, setupMessageListener)
 @ ./src/ui/views/webview/executionViewMain.ts

WARNING in ./src/ui/views/webview/ExecutionView.svelte 664:2-12
export 'openTicket' (imported as 'openTicket') was not found in './vscode' (possible exports: __esModule, applyAutoFix, approveVerification, getVerification, getVscodeApi, ignoreIssue, openFile, postMessage, refresh, requestChanges, setupMessageListener)
 @ ./src/ui/views/webview/executionViewMain.ts

WARNING in ./src/ui/views/webview/ExecutionView.svelte 668:2-18
export 'viewVerification' (imported as 'viewVerification') was not found in './vscode' (possible exports: __esModule, applyAutoFix, approveVerification, getVerification, getVscodeApi, ignoreIssue, openFile, postMessage, refresh, requestChanges, setupMessageListener)
 @ ./src/ui/views/webview/executionViewMain.ts

WARNING in ./src/ui/views/webview/components/IssueItem.svelte
Module Warning (from ./node_modules/svelte-loader/index.js):
Unused CSS selector ".fix-suggestion p" (145:2)
143: 
144:   .suggestion p,
145:   .fix-suggestion p {
       ^
146:     margin: 0;
147:     color: var(--vscode-foreground);
 @ ./src/ui/views/webview/components/IssueList.svelte 27:0-43 137:17-26
 @ ./src/ui/views/webview/VerificationView.svelte 34:0-54 233:17-26
 @ ./src/ui/views/webview/verificationViewMain.ts

5 warnings have detailed information that is not shown.
Use 'stats.errorDetails: true' resp. '--stats-error-details' to show it.

ERROR in ./src/ui/editors/webview/SpecEditor.svelte 36:0-48
Module not found: Error: Can't resolve '../../utils/debounce' in '/Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview'
 @ ./src/ui/editors/webview/specEditorMain.ts

ERROR in ./src/ui/editors/webview/TicketEditor.svelte 39:0-48
Module not found: Error: Can't resolve '../../utils/debounce' in '/Users/mkemp/repos/tmp-traycer-cp/src/ui/editors/webview'
 @ ./src/ui/editors/webview/ticketEditorMain.ts

ERROR in ./src/ui/views/webview/components/ExecutionTimeline.svelte
Module build failed (from ./node_modules/svelte-loader/index.js):
ParseError: Unexpected token
    at error (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte/compiler.cjs:14256:16)
    at Parser.error (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte/compiler.cjs:14404:3)
    at Parser.acorn_error (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte/compiler.cjs:14391:8)
    at read_expression (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte/compiler.cjs:9641:10)
    at mustache (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte/compiler.cjs:13965:22)
    at new Parser (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte/compiler.cjs:14352:12)
    at parse (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte/compiler.cjs:14529:17)
    at compile (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte/compiler.cjs:45642:14)
    at injectVarsToCode (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte-preprocess/dist/transformers/typescript.js:87:45)
    at mixedImportsTranspiler (/Users/mkemp/repos/tmp-traycer-cp/node_modules/svelte-preprocess/dist/transformers/typescript.js:263:26)
 @ ./src/ui/views/webview/ExecutionView.svelte 32:0-70 201:25-42
 @ ./src/ui/views/webview/executionViewMain.ts

2 errors have detailed information that is not shown.
Use 'stats.errorDetails: true' resp. '--stats-error-details' to show it.

webpack 5.105.0 compiled with 3 errors and 8 warnings in 1853 ms
