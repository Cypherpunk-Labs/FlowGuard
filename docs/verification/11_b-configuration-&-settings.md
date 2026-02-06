I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: ConfigurationWatcher still passes identical old/new values; pattern matching broken for sub-keys.

**Fix ConfigurationWatcher to provide accurate old/new values and proper pattern matching.**

**Full Context (Original Comment + Thread Insights):** The original review highlighted that `notifyWatchers` uses post-change `getAll()` for both old/new, making them identical, and ignores `pattern`. Current implementation debounces but still captures oldValue post-change (line 85), and `matchesPattern` call (line 109) passes static `reg.section` instead of dynamic changed info. No specific key extraction from `ConfigurationChangeEvent`. Root cause: VS Code `onDidChangeConfiguration` fires *after* changes; need proactive old-value capture.

**Root Problem:** Handlers can't diff old/new (e.g., to avoid unnecessary recreations) or filter sub-keys (e.g., only `llm.provider`, not all `llm.*`).

**Concrete Steps to Fully Resolve:**
1. **Capture Old Values Proactively:** In `ConfigurationManager.setInVSCode` (line ~159), *before* `config.update()`:
   - Snapshot `oldValue = this.getAll()`.
   - Store in temp map: `pendingChanges.set(changeId, {oldValue, section, key})` (use UUID or timestamp).
   - Emit early via custom event or queue.
2. **Handle External Changes:** For non-set changes, use optimistic reload: debounce `newValue`, assume old from last known cache.
3. **Extract Changed Keys:** In `handleConfigurationChange`:
   ```ts
   const changedKeys = [];
   for (const section of allSections) {
     if (event.affectsConfiguration(`flowguard.${section}.*`)) { // wildcard approx
       // Test specific: event.affectsConfiguration(`flowguard.${section}.logLevel`)
     }
   }
   ```
   Pass `{changedSection, changedKeys[]}` to `notifyWatchers`.
4. **Fix matchesPattern:** Update signature/call:
   ```ts
   matchesPattern(pattern: string, changedSection: string, changedKeys: string[]): boolean
   // Glob match: e.g., 'llm.*' matches if changedSection==='llm'
   // Specific: 'llm.provider' if 'provider' in changedKeys
   ```
5. **Handler Signature:** `(newConfig: FlowGuardConfig, oldConfig: FlowGuardConfig | null, changes: {section: string, keys: string[]})`
6. **Cache Integration:** Update `ConfigurationManager` cache timestamp; invalidate only affected sections precisely.
7. **Built-in Watchers:** Migrate to new signature, e.g., `llm` watcher checks if 'provider' or 'model' in changes.keys.
8. **Edge Cases:**
   - Rapid changes: debounce preserves last old.
   - Workspace/user scope: respect `event.affectsConfiguration` scopes.
   - Tests: Mock `onDidChangeConfiguration` with fake events; verify handler receives distinct old/new.

**Bigger Picture:** Ensures reactive services (LLM provider recreation, template reload) only when needed, improving perf/stability. Fits centralized config architecture.

**Self-Contained Fix Instructions:**
In `src/core/config/ConfigurationManager.ts`, before `await config.update(...)` in `setInVSCode`, capture `oldConfig = this.getAll()` and emit via new `beforeChange` event with `{oldConfig, section, key}`. In `ConfigurationWatcher.handleConfigurationChange`, extract changed sub-keys by testing `event.affectsConfiguration('flowguard.general.logLevel')` for known keys. Update `notifyWatchers` to pass `{newValue, oldValueFromCache, changedSection, changedKeys}` to filtered handlers. Fix `matchesPattern(pattern, changedSection, changedKeys)` using globstar matching (e.g., minimatch lib or simple split/regex). Update all built-in `registerWatcher` calls and handlers to use new params. Add unit test simulating config change verifying old/new differ.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/core/config/ConfigurationWatcher.ts
- /Users/mkemp/repos/tmp-traycer-cp/src/core/config/ConfigurationManager.ts
---