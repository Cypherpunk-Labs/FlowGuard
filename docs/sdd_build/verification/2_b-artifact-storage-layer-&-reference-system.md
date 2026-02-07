I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Artifact paths ignore workspace root/flowguard root, leading to files written in CWD instead of workspace .flowguard

Update `src/core/storage/constants.ts` helpers (`getSpecPath`, `getTicketPath`, `getExecutionPath`, etc.) to accept a base path or remove them in favor of methods inside `ArtifactStorage` that `path.join` the `workspaceRoot`/`flowguardRoot` with `.flowguard/<type>/...`. In `ArtifactStorage.initialize()`, call `ensureDirectory` with `path.join(this.flowguardRoot, 'specs')`, `tickets`, `executions`, `verifications` instead of the relative constants. Ensure all reads/writes (save/load/delete/list) use the absolute joined path so artifacts are stored under the workspace’s `.flowguard` regardless of process CWD.

### Referred Files
- {WORKSPACE}/src/core/storage/ArtifactStorage.ts
- {WORKSPACE}/src/core/storage/constants.ts
- {WORKSPACE}/src/core/references/ReferenceResolver.ts
---
## Comment 2: Auto-commit for deletions never stages removed artifact files, so git history doesn’t record deletes

Before committing a delete, stage the removed file path (or call `git.rm`). In each delete method of `StorageManager`, invoke `gitHelper.stageFiles([relativePath])` or extend `GitHelper` with a `stageDeletion` helper that calls `git.rm`/`git.add` for the removed artifact, then call `commitArtifact` so the deletion is recorded.

### Referred Files
- {WORKSPACE}/src/core/storage/index.ts
- {WORKSPACE}/src/core/git/GitHelper.ts
---
## Comment 3: Epic metadata settings fields are dropped on load/validate, losing defaultAgent/templatePreferences

In `validateMetadata` (and when merging in `updateEpicMetadata`), preserve all recognized settings fields: copy `defaultAgent`, `autoCommit`, and `templatePreferences` (and pass through other object keys if desired). Ensure `settings` is spread from the parsed JSON before applying defaults so existing metadata isn’t truncated on load/save.

### Referred Files
- {WORKSPACE}/src/core/storage/EpicMetadataManager.ts
- {WORKSPACE}/src/core/storage/types.ts
---