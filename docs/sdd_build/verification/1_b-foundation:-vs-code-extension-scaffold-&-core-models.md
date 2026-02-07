I have the following verification comments after thorough review and exploration of the codebase. Implement the comments by following the instructions in the comments verbatim.

---
## Comment 1: Error handling added for parsing failures, but no validation or coercion for Date/enum fields.

**Full Context from Review Thread:**
Original comment highlighted risks of crashes from malformed YAML and untyped data (strings for Dates/enums). Discussion noted need for try/catch AND validation/coercion. Current implementation added try/catch for parsing but retains unchecked `as T` cast, leaving root cause of type mismatches unaddressed.

**Root Cause:** YAML parsing produces plain objects; TypeScript interfaces don't enforce runtime validation. Models like `Epic` expect `Date` for `createdAt`/`updatedAt`, union strings for `status`, but parsed data stays as unprocessed YAML values.

**Complete Solution Approach:**
Build upon existing try/catch by adding a post-parse `normalizeFrontmatterData<T>` function in `src/core/parsers/frontmatter.ts` that:
1. **Date Coercion**: For any `Date` fields in T (detect via reflection or known paths), convert ISO strings: `if (typeof val === 'string') { const d = new Date(val); if (!isNaN(d.getTime())) return d; else throw new ValidationError(...); }`
2. **Enum Validation**: Define `enumValidators` map for known models (e.g., `{ EpicStatus: ['planning', 'active', ...] }`), check `val in allowedValues`.
3. **Generic Fallback**: Use a schema registry: `getValidator<T>()` returning Zod-like validator (simple impl without deps).
4. **Integration**: `parseFrontmatter(markdown, { validate: true })` optional param to enable.
5. **Error Handling**: Throw `FrontmatterValidationError` extending `FrontmatterParseError` with field path and expected type.
6. **Model Integration**: Export validators from `src/core/models/index.ts` (e.g., `validateEpic(data: unknown): Epic`).
7. **Usage in Broader Codebase**: Update future parsers/storages to use validated parsing. Ensure `src/storage/` (Phase 2) loads artifacts with validation.
8. **Testing**: Add unit tests for invalid dates/enums throwing correctly, valid cases passing.

**Concrete Steps for Engineer:**
In `src/core/parsers/frontmatter.ts`, parsing triggers `matter(markdown)` without debounce or cancellation, showing stale results when responses arrive out of order.
Wrap the input handler with a 250–300ms debounce and cancel any in-flight request when a new keystroke occurs (track a controller/token).
Update `src/hooks/useSearch.ts` to expose `cancel()` and respect the latest invocation only.

**presentation_instructions:**
In `src/core/parsers/frontmatter.ts` `parseFrontmatter()` now catches parse errors but performs unchecked `result.data as T` cast, leaving Date strings unconverted and enums unvalidated.
After `matter()`, call `normalizeData<T>(result.data)`:
- Traverse known Date fields (`createdAt`, `updatedAt`): `if (string) new Date(str) else throw`.
- For enums (`status`): `if (!['planning','active',...].includes(val)) throw`.
- Return coerced object or throw `ValidationError`.
Update return type to `Promise<FrontmatterDocument<T>>` for async validation if needed.
Export `normalizeEpic(data: unknown): Epic`, etc., from `src/core/models/`.


### Referred Files
- {WORKSPACE}/src/core/parsers/frontmatter.ts
---