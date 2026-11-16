---
name: coherence-reviewer
description: Keep the codebase coherent, so that each concern is solved by one model instead of several locally valid but incompatible ones. Use when planning or making a change that adds a pattern, abstraction, extension point, helper, error or state mechanism, and to review the full diff after completing a task in a pull request.
---

# Coherence Reviewer

## Background

This skill is based on the essay [The Decoherence Trap](https://maevyn.codes/decoherence). Read it for the full argument; the essentials:

- **Decoherence** is "the accumulation of locally valid but mutually incompatible or redundant models within a system". In code it shows up as many locally sensible ways of doing the same thing, none of which fit together.
- **Coherence** is what keeps software adaptable. The essay's test: take an abstraction and see how well it holds up in different contexts, and how much the code has to bend to fit each one.
- **Decoherence grows with change, not with time.** Every change can add a model. It accumulates under pressure: under deadlines, even experts stop at something they are pretty sure will work.
- **Typical causes:** starting a new transition before the previous one is finished, short-term customization, and AI-assisted changes, where each generation has some chance of introducing a new model.
- **Symptoms:** several patterns for the same task, bugs because someone missed a step that only one of the patterns needs, code that needs expertise in both systems, and code that gets patched around when the first new problem does not fit.
- **Remedy:** decoherence only goes away when the code changes. Restoring an old pattern restarts the cycle; boundaries limit how far a model spreads.

## Core question

> Does this change add a second way of doing something the codebase already does, and if it does, does it remove the first one?

## Conventions

1. **Find before you build.** Before adding a mechanism, search how the codebase already solves the concern and reuse it. Established models in Teaching Dev include:
   - packages extend the platform from their `register.ts` (`documentStore.registerDocumentType`, `viewStore.registerStore`, `socketStore.registerRecordHandler`, `componentStore.registerContainerComponent`);
   - api calls live in `src/api/*.ts` and go through the shared axios instance from `@tdev-api/base`;
   - stores load data with `withAbortController` from `iStore`; components reach stores with `useStore`;
   - shared state lives in MobX stores and models, not in components.
2. **One model per concern.** A new model is only acceptable if it replaces the old one. Migrate all usages in the same pull request. If that is too large, state the transition in the pull request (old model, new model, remaining call sites) and do not start another transition in the same area before it is finished.
3. **Remove what you replace.** Do not leave the superseded path, dead fallbacks or compatibility shims behind. A shim that must stay needs a reason and a removal condition in a comment.
4. **Fit the abstraction, do not bend it.** If a new use needs flags, special cases or casts (`as unknown as`) to fit an existing abstraction, stop: either the abstraction is wrong for this use or the use belongs elsewhere.
5. **One contract per module.** Inside a module, report errors one way, receive context one way (e.g. as parameters, not partly as parameters and partly from a global), and name things one way. Extension points document the contract with one example.
6. **Substitutes implement the real interface.** Fakes, offline variants and test doubles must implement the full interface they stand in for, or be typed as their own thing. A partial imitation becomes a second model that fails where callers rely on the missing part.
7. **Respect ownership boundaries.** Code specific to a package lives in that package. Core code must not know package endpoints, document types or settings.
8. **Review the whole, not the steps.** Every edit can be locally valid while the sum adds models, especially in turn-by-turn or AI-assisted work. Review the complete diff of a task, not only the last edit.

## Review process

1. List the concerns the diff touches, e.g. data loading, error reporting, configuration, extension, state ownership.
2. For each concern, count the ways the codebase handles it after the change, and compare with before. Search the codebase; do not rely on memory.
3. Classify each finding:
   - **Introduced by this change:** fix it before reporting back.
   - **Already there, in code this change touches:** fix it if the fix is small and fits the scope; otherwise list it.
   - **Already there, untouched:** list it only.
4. Do not fix findings that need an owner decision (larger migrations, changed requirements). Describe them with concrete options.

## Output

For a substantive review, use this structure; for small changes, a few sentences are enough.

- **Coherence verdict:** Improves / Neutral / Degrades, with the most consequential reason.
- **Models removed or unified** by the change.
- **Parallel models remaining**, ordered by impact, each with file references, its classification from step 3 and a concrete fix.
- **Open transitions** started by this change, with their remaining call sites.

## Guardrails

- Coherence is not deduplication at any cost: concerns that differ in their domain may need different models. Unify what does the same thing, not what looks alike.
- Do not widen a pull request into a large migration to fix pre-existing decoherence. Propose it as a separate change.
- Point to concrete files and call sites; do not claim a parallel model exists without having found it.
- Use together with the [`long-term-maintainability-reviewer`](../long-term-maintainability-reviewer/SKILL.md), which weighs complexity against benefit, and implement the resulting changes following the [`code-style`](../code-style/SKILL.md) skill.
