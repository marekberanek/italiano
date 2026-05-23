# uu5 Component Review — MUST Requirements Compliance Check

## Purpose & Scope
Verify that uu5 library components comply with all MUST requirements from official documentation. Produce actionable findings with specific file/line references and exact fixes.

**Target**: uu5 library components, visual components, ECC/EBC components, components used in uu5String contexts.

## Output Format (Always Required)

### 1) Quick Summary (2–5 bullets)
Brief overview of compliance status and key findings

### 2) Verdict
**Compliant** / **Request changes** (1-line reason)

### 3) Findings Table
| Severity | Category | File:Line | Finding | MUST Reference | Suggested fix |
|---|---|---|---|---|---|

**Severity legend:** Blocker (missing MUST) • Major (partial compliance) • Minor (best practice) • Nit

### 4) Checklist Status
See Implementation Checklist below

### 5) Questions (≤3 only if essential context is missing)

## Authoritative Documentation (read when in doubt)

- Nesting level: `https://uuapp.plus4u.net/uu-bookkit-maing01/abf2306ac0374c7bbb0541eb9fa68a2f/book/page?code=nestingLevel`
- Nesting level tests: Inline `?code=38114548`, Spot `?code=53309497`, Area `?code=69353543`, How to test `?code=51445468`
- Designing uu5 components: `https://uuapp.plus4u.net/uu-bookkit-maing01/0238a88bac124b3ca828835b57144ffa/book/page?code=8c83b23a`
- uu5String cross-app: `https://uuapp.plus4u.net/uu-bookkit-maing01/0238a88bac124b3ca828835b57144ffa/book/page?code=a85fd4d0`
- Localization: `?code=localization`
- URL parameters: `?code=urlParameters`
- Search: `?code=Search`
- Data loading: `?code=dataLoading`
- Errors: `?code=errors`
- User preferences: `?code=userPreferences`
- Print: `?code=print`

## MCP Tooling (Plus4U documentation access)

- Use `mcp_book_list_structure` to enumerate book structure
- Use `mcp_document_find` to locate pages with MUST/acceptance criteria
- Use `mcp_aichat_ask` to extract exact MUST statements
- Use `mcp_document_get_bml_images` for embedded diagrams
- Use `mcp_document_read_attachment` for attached examples/code
- Combine with `codebase_search` and `grep` for implementation mapping

## MUST Requirements Checklist

### 1) Nesting Level MUSTs

- [ ] Static `nestingLevel` lists supported visualizations (highest to lowest)
- [ ] Accepts `nestingLevel` prop; resolves via `Utils.NestingLevel.getNestingLevel`
- [ ] At least `inline` visualization supported
- [ ] Correct visualization rendered for received level
- [ ] Nearest-lower fallback implemented (never render higher than requested)
- [ ] Dynamic content receives appropriate nesting level
- [ ] Route level sets meaningful window title
- [ ] `detailTarget` defined (default: `modal`)
- [ ] `detailNewTabTarget` defined (default: `route` when `detailTarget=modal`)

### 2) Inline Acceptance Criteria

- [ ] Renders in single line (no line break)
- [ ] CSS: `display: inline-flex; vertical-align: baseline; white-space: nowrap;`
- [ ] Height responds to font-size (no fixed height)
- [ ] Color independent from surrounding text (uses `colorSchema`)
- [ ] Click opens modal/route per `detailTarget/detailNewTabTarget`

### 3) Spot Acceptance Criteria

- [ ] Falls back to `inline` if spot missing
- [ ] Does not break line
- [ ] Width auto-fits content
- [ ] Height follows spot sizing palette (controlled by `size` prop)
- [ ] No scrollbar on overflow

### 4) Area Acceptance Criteria

- [ ] Falls back to `box`/`spot`/`inline` (nearest-lower)
- [ ] Fills available width
- [ ] Height adapts to content
- [ ] Scrollbar allowed when content overflows

### 5) Component Design Properties

- [ ] Exposes `bgStyle` prop
- [ ] Exposes `borderRadius` prop
- [ ] Exposes `colorSchema` prop
- [ ] Exposes `elevation` prop
- [ ] Props plumbed to rendered elements

### 6) uu5String Cross-App Awareness

- [ ] Detects own vs foreign application context
- [ ] Alters behavior accordingly (actions, links)

### 7) Localization

- [ ] All user-visible strings via LSI
- [ ] Error messages, labels, buttons localized
- [ ] `lsiError` wired in `ContentContainer`

### 8) Data Loading

- [ ] Handles loading/loaded/error states
- [ ] Uses data providers (`DataListProvider`/`useDataList`)
- [ ] Supports paging via `onLoad`/`handlerMap.loadNext`

### 9) Error Handling

- [ ] User-friendly error UI on failures
- [ ] Uses `Plus4U5Elements.Error` with LSI messages
- [ ] No silent error swallowing

### 10) Search/Filter (if applicable)

- [ ] Search/filter controls exposed
- [ ] Client/server strategy supported
- [ ] Server-backed wired to `handlerMap.load`

### 11) User Preferences (if applicable)

- [ ] Configurable views persist preferences
- [ ] Stable key for persistence
- [ ] Restored on mount

### 12) Print Support

- [ ] `@media print` CSS hides controls/toolbars
- [ ] High-contrast printed text
- [ ] Layout fits page width

### 13) Edit Mode (uuEcc)

- [ ] Visual tab includes "Nesting level" control
- [ ] Options 1:1 with unique visualizations

## Example Findings

| Severity | Category | File:Line | Finding | MUST Reference | Suggested fix |
|---|---|---|---|---|---|
| Blocker | Nesting | `component.js:15` | Missing static `nestingLevel` | §1 Static declaration | Add `MyComponent.nestingLevel = ["area", "spot", "inline"]` |
| Blocker | Inline | `component.css:20` | Fixed height `32px` breaks font-size responsiveness | §Inline Height | Remove fixed height, use `em` units |
| Major | Design | `component.js:45` | `colorSchema` prop not plumbed to Card | §2 Design Props | Pass `colorSchema` to `<Card colorSchema={props.colorSchema}>` |
| Major | LSI | `component.js:78` | Hardcoded "Loading..." string | §4 Localization | Use `useLsi` hook with LSI key |
| Minor | Print | `component.css` | No `@media print` rules | §10 Print | Add print CSS hiding toolbar |

## Review Checklist Status (example)
- Nesting Level ✅ · Inline ❌ · Spot ✅ · Area ⚠️ · Design Props ✅ · LSI ❌ · Data Loading ✅ · Errors ✅ · Print ❌

## Starter Snippets (reference)

```tsx
// Nesting level static declaration
MyComponent.nestingLevel = ["area", "box", "spot", "inline"];

// Visualization selection (nearest-lower fallback)
const ORDER = ["route","areaCollection","area","boxCollection","box","spotCollection","spot","inline"];
function pickVisualization(requested, supported) {
  const reqIdx = ORDER.indexOf(requested);
  for (let i = reqIdx; i < ORDER.length; i++) if (supported.includes(ORDER[i])) return ORDER[i];
  return "inline";
}
```

```css
/* Inline variant CSS */
.component-inline {
  display: inline-flex;
  vertical-align: baseline;
  white-space: nowrap;
}

/* Print support */
@media print {
  .component-toolbar { display: none !important; }
  .component-root {
    background: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
  }
}
```

## Notes
- If a MUST cannot be implemented, document reason in component docs with link to acceptance criteria.
- Validate nesting behavior using official test pages (Inline, Spot, Area).
- LSI entries required for all visible strings (en/cs minimum).
