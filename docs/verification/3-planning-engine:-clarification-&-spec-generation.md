I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: TreeSitterAnalyzer sets languages incorrectly, so non-TS/JS parsing fails and CodebaseExplorer can’t analyze those files.

Open `src/planning/codebase/TreeSitterAnalyzer.ts`. In `initialize()`, after importing `tree-sitter`, change each `loadLanguage` to select the concrete grammar export rather than `langModule.default` (e.g., for `tree-sitter-typescript` use `langModule.typescript`, for `tree-sitter-javascript` use the default export, for `tree-sitter-python` use its default). Call `parser.setLanguage(selectedGrammar)` with that grammar. Keep the existing try/catch but only fall back when parser creation fails. Verify `analyzeFile` no longer throws for JS/TS/Python files.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/planning/codebase/TreeSitterAnalyzer.ts
---
## Comment 2: SpecGenerator never saves specs to storage, so generated specs are lost and not aligned with planned persistence.

Update `src/planning/SpecGenerator.ts` to accept an `ArtifactStorage` (or a save callback) and call `saveSpec(spec)` after constructing the `spec`. Ensure the spec’s frontmatter/markdown matches storage expectations. If injection is not desired, at least expose a `saveSpec` helper and use it in `generateSpec` so the generated spec is written to the storage directory before returning.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/planning/SpecGenerator.ts
---
## Comment 3: MermaidGenerator produces invalid node syntax and class definitions, so generated diagrams won’t render.

Adjust `generateArchitectureDiagram` to emit valid Mermaid: choose the shape by embedding it into the node declaration (e.g., use standard node syntax or `:::class` with `classDef name fill:#...`). Remove the extra shape suffix; instead emit `id[Label]`/`id((Label))` per type and add separate `classDef <class> fill:...,stroke:...` lines with `class id <class>`. Ensure no stray spaces (e.g., `[( )]`, `> ]`) remain. Verify output renders in Mermaid live editor.

### Referred Files
- /Users/mkemp/repos/tmp-traycer-cp/src/planning/diagrams/MermaidGenerator.ts
---