I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: API key setting is missing from contributed configuration schema

Add a `flowguard.llm.apiKey` string setting to `package.json` under `contributes.configuration.properties` with a clear description and scope, so users can supply the key via the settings UI. If you prefer to keep secrets in SecretStorage, still expose a setting or command-driven entry point that writes into `SecureStorage` to honor the requested schema/UI discoverability.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/package.json
---
## Comment 2: ConfigurationWatcher never provides old vs new values and ignores patterns, so watchers can’t react correctly

Capture the configuration snapshot before applying the change and pass it as `oldValue`, and fetch the refreshed config after the change for `newValue`. Use the `pattern` parameter to filter handlers (e.g., match `*` or specific keys) based on the affected section from `onDidChangeConfiguration`. Ensure debounce stores both old and new snapshots so handlers can compare and act.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/core/config/ConfigurationWatcher.ts
---
## Comment 3: LLM default model ignores env-selected provider, causing provider/model mismatch

Resolve the effective provider once (including environment fallbacks) and use that to pick the default model. For example, derive provider via settings or env, then call `getDefaultModel(resolvedProvider)` when no model is set, so Anthropic picks a Claude model and Local picks a local model.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/core/config/ConfigurationManager.ts
---