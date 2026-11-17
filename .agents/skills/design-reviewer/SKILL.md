---
name: design-reviewer
description: Review a design or a completed diff for Teaching Dev as its long-term owner, checking that every concern keeps one model and that new complexity is worth what it costs. Use when planning or completing a task that adds a new mechanism (store, extension point, async flow, error reporting or dependency), and once on the whole branch before opening a pull request.
---

# Design Reviewer

Review as the developer who will maintain this code for the next years. Two lenses, one review:

- **Coherence:** each concern is solved by one model. Every change, especially AI-assisted, can add a second locally valid model that does not fit the first ([The Decoherence Trap](https://maevyn.codes/decoherence), background for humans; no need to fetch it). Decoherence only goes away when code changes.
- **Cost:** every new concept, state, branch and failure path is something a maintainer must understand. It needs a real requirement that justifies it.

## Core questions

> 1. Does this change add a second way of doing something the codebase already does, and if so, does it remove the first?
> 2. What will a maintainer need to understand that they did not before, and could a simpler change deliver most of the value?

## Established models

Compare the change against this table, not against memory. A concern listed here has exactly one accepted model. If the change deliberately replaces a model, update this table in the same pull request.

| Concern | Model | Where | Accepted exceptions |
| --- | --- | --- | --- |
| Package extension | `register.ts` calls `documentStore.registerDocumentType` (factory, `defaultMeta`, `createOnNewRecord`), `componentStore.registerContainerComponent` / `registerEditorComponent` / `registerDocumentView`, `socketStore.registerRecordHandler`, `viewStore.registerStore`; types via `declare module '@tdev-api/document'` in the package's `index.ts` | `packages/*/*/register.ts`, `index.ts` | — |
| New document type | `iDocument` model + `TypeMeta` subclass, started from `_scaffold.ts` | `src/models/documents/`, or the package | — |
| Backend calls | function per endpoint in `src/api/*.ts`, using the shared `api` from `@tdev-api/base`, taking an `AbortSignal` | `src/api/` | `fetch()` of static files under `siteConfig.baseUrl` (`PageStore`, `Root.tsx`); `fetch()` of browser-local blob or data URLs (`quill-img-compress/dropImage.ts`) |
| Request state and cancellation | `withAbortController(sigId, …)` and `apiStateFor` from `iStore` | `src/stores/iStore.ts` | — |
| Offline mode | offline adapter serving the same `src/api` calls from the `RouteTable`; errors as `OfflineHttpError` | `src/api/OfflineApi/` | — |
| Real-time updates | `IoEvent`s dispatched by `SocketDataStore` to handlers registered per record type with `registerRecordHandler`; core handlers in `coreRecordHandlers.ts` | `src/stores/SocketDataStore.ts`, `src/stores/coreRecordHandlers.ts`, `src/api/IoEventTypes.ts` | — |
| Shared state | MobX stores owned by `rootStore` (app lifetime); view state in view stores; components use `useStore` | `src/stores/` | local `useState` for state that dies with the component |
| Browser persistence | `Storage` with a key in `StorageKey`, or `useLocalStorage` in components | `src/stores/utils/Storage.ts`, `src/hooks/useLocalStorage.ts` | IndexedDB only inside the offline API |
| Configuration | typed `customFields.tdevConfig` (`siteConfig.d.ts`); package options in its plugin config | `src/siteConfig/` | — |
| Docusaurus overrides | swizzled components in `src/theme/`, wrapping `@theme-original/*` where possible | `src/theme/` | — |
| Styling | co-located `styles.module.scss`, Infima `--ifm-*` vars, `clsx` | see `AGENTS.md` | inline style only for runtime values |
| User-facing errors | **no single model yet**: `FileTreeView.addNotification` inside the file tree, `console.error` elsewhere | — | do not add a third global mechanism in passing; that is an owner decision |

## What to check

**Coherence**

1. **Find before you build.** Before adding a mechanism, look up the concern in the table, then search for it (`rg` for the store method, hook or api module). Reuse what exists. A concern that is missing from the table but already has a recurring pattern in the code is a finding too: add it to the table.
2. **One model per concern.** A new model is only acceptable if it replaces the old one, with all usages migrated in this pull request. If the migration touches more than the files already in the diff plus a handful of call sites, state the transition in the pull request instead (old model, new model, remaining call sites), and do not start another transition in the same area.
3. **Remove what you replace.** No superseded paths, dead fallbacks or shims. A shim that must stay gets a comment with its reason and removal condition.
4. **Fit the abstraction, do not bend it.** Flags, special cases or `as unknown as` to make a use fit an existing abstraction mean the abstraction is wrong for this use or the use belongs elsewhere. Existing casts elsewhere are no precedent.
5. **One contract per module.** Errors reported one way, context received one way (parameters or store, not both), names following one scheme.
6. **Substitutes implement the real interface.** Offline variants, fakes and test doubles implement the full interface, or are typed as their own thing.
7. **Respect ownership.** Package-specific code lives in the package. Core code (`src/`) must not know package document types, endpoints or settings.

**Cost**

8. **Necessity.** Name the user or teacher problem each new mechanism solves. Optimizations and edge cases need evidence (a bug, a measurement, a real class), not hypothetical flexibility.
9. **Lifecycle and ownership.** Who creates, cancels and disposes each request, reaction, timer, socket listener or worker? Stores live as long as the app; anything shorter needs an explicit dispose.
10. **Failure paths specific to this platform.** Check, where relevant:
    - server-side rendering during `yarn build`: browser APIs only behind `ExecutionEnvironment.canUseDOM` or in effects;
    - offline mode and unavailable IndexedDB;
    - aborted or out-of-order requests (stale responses overwriting newer state);
    - socket events arriving for records that are not loaded, or twice;
    - users without the expected permissions (student, teacher, admin, logged out).
11. **Render cost.** List rows and app-root context must follow the MobX and React rules in `AGENTS.md`. A change that re-renders every row is a regression, not a style nit.
12. **Coupling, dependencies and size.** Flag private Docusaurus or runtime internals without a comment naming the dependency, new packages that existing code could cover or that break server-side rendering, and independent concerns that should ship as separate pull requests.

Do not reject justified complexity, and do not measure maintainability by line count, file count or number of abstractions. Coherence is not deduplication at any cost: unify what does the same thing, not what looks alike, and keep separate models where the domains differ. Never simplify away a user-facing guarantee or an owner-approved requirement.

## Process

Run the review in a fresh context, as the reviewer subagent, not in the context that wrote the code. The reviewer reads and reports; it does not edit files. The main agent implements the fixes.

1. **Pick the diff.**
   - After a task that adds a new mechanism: the task's commits, all of them, not just the last edit (`git diff <commit before the task>..HEAD`).
   - Before opening the pull request: the whole branch against the branch the pull request targets, from their merge base (`git diff $(git merge-base origin/<target> HEAD)`). Branches are often stacked, so the target is not always `main`, and diffing against `main` would review the parent branches too.
2. List the concerns the diff touches and look each up in the table. If a symbol the table names no longer exists (`rg` finds nothing), report the table fix first. For each concern, count the models before and after the change; search the code, do not rely on memory.
3. Go through the checks above. Skip the ones that do not apply; do not pad the review.
4. Classify each finding:
   - **Introduced by this change:** must be fixed before reporting back to the user.
   - **Pre-existing, in code this change touches:** fix it if it is small and in scope; otherwise report it.
   - **Pre-existing, untouched:** report it only.
   - **Needs an owner decision** (a larger migration, a changed requirement, a new global mechanism): not implemented; describe two or three concrete options.

Point to files and call sites for every finding. Do not claim a parallel model or a missing test without having found it. Separate verified defects from plausible risks.

The main agent then implements the findings to fix, following [`code-style`](../code-style/SKILL.md), and reruns validation.

## Report

For small changes, two to four sentences. Otherwise: a verdict (Proceed / Simplify / Split / Reconsider, and Coherence: Improves / Neutral / Degrades, with the single most consequential reason), then findings, most important first, each with file reference, classification and concrete fix or options, then any open transitions with their remaining call sites.

A diff adds `src/components/Foo/useFooData.ts`, which calls `api.get('/foo')` inside a `useEffect` and keeps the result in `useState`.

> **Verdict:** Simplify. Coherence: Degrades. The diff adds a second way to load backend data.
> **Findings:** `src/components/Foo/useFooData.ts`, introduced by this change: move the request to `src/api/foo.ts` with an `AbortSignal`, load it in `FooStore.load()` through `withAbortController('load', …)`, read it in the component with `useStore('fooStore')`, and delete `useFooData.ts`.

A non-finding: `PageStore` uses `fetch()` for `pageIndex.json`. That file is a static asset, not a backend call, so it is an accepted exception and not a second model.

## Documentation-only changes

A short check is enough: is it consistent with existing docs and agent instructions, and does it avoid duplicating a reference? Skip the cost lens unless the change contains code, such as MDX components or examples.
