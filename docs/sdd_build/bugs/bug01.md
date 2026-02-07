> flowguard@0.1.0 compile
> webpack --config webpack.config.js --mode production && webpack --config webpack.webview.config.js --mode production

assets by status 4.5 MiB [cached] 1 asset
orphan modules 9.95 KiB [orphan] 18 modules
runtime modules 1.04 KiB 5 modules
modules by path ./node_modules/ 10.5 MiB
  cacheable modules 10.5 MiB 217 modules
  ./node_modules/typescript/lib/ sync 160 bytes [optional] [built] [code generated]
  ./node_modules/node-fetch/lib/index.mjs + 3 modules 44.3 KiB [not cacheable] [built] [code generated]
modules by path ./src/ 526 KiB
  cacheable modules 526 KiB 74 modules
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

ERROR in ./src/ui/editors/SpecEditorProvider.ts 9:32
Module parse failed: Unexpected token (9:32)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| import { validateSpec } from './utils/validation';
| 
> export class SpecEditorProvider implements vscode.CustomTextEditorProvider {
|   private readonly _extensionUri: vscode.Uri;
|   private readonly _storage: ArtifactStorage;
 @ ./src/extension.ts 57:29-71

ERROR in ./src/ui/editors/TicketEditorProvider.ts 9:34
Module parse failed: Unexpected token (9:34)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| import { validateTicket } from './utils/validation';
| 
> export class TicketEditorProvider implements vscode.CustomTextEditorProvider {
|   private readonly _extensionUri: vscode.Uri;
|   private readonly _storage: ArtifactStorage;
 @ ./src/extension.ts 58:31-75

ERROR in ./src/ui/sidebar/SidebarProvider.ts 17:29
Module parse failed: Unexpected token (17:29)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| import { v4 as uuidv4 } from 'uuid';
| 
> export class SidebarProvider implements vscode.WebviewViewProvider {
|   private _view?: vscode.WebviewView;
| 
 @ ./src/extension.ts 56:26-65

ERROR in ./src/ui/views/ExecutionViewProvider.ts 11:35
Module parse failed: Unexpected token (11:35)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| } from './types';
| 
> export class ExecutionViewProvider implements vscode.WebviewViewProvider {
|   private _view?: vscode.WebviewView;
| 
 @ ./src/extension.ts 60:32-75

ERROR in ./src/ui/views/VerificationViewProvider.ts 12:38
Module parse failed: Unexpected token (12:38)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| import { Verification, VerificationIssue } from '../../core/models/Verification';
| 
> export class VerificationViewProvider implements vscode.WebviewViewProvider {
|   private _view?: vscode.WebviewView;
| 
 @ ./src/extension.ts 59:35-81

webpack 5.105.0 compiled with 5 errors and 4 warnings in 15830 ms
