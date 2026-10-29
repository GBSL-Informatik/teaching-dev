---
name: code-style
description: How to structure code so that humans can review it. Use whenever you write or modify code (packages, scripts, tests, website), before writing it.
---

# Code style

Humans review all the code of this repository: write code that is easy to read and understand, even if it requires introducing intermediate abstractions.


## Structure code as a tree

Readers should see the high-level behavior first and follow implementation
details only when needed.

- Keep component bodies and public store/model methods focused on their
  main responsibility. Delegate substantial implementation details to
  well-named subcomponents, hooks, methods, or helper functions.
- Keep each function at a consistent level of abstraction. Leave short
  checks and straightforward transformations inline; extract details when
  naming them makes the overall flow easier to understand.
- Keep business logic and shared state transitions in MobX stores and
  models. Components describe the UI and handle component-specific
  interactions. Use computed getters for derived observable state.
- Use early returns for guards and completed branches so the main flow
  stays easy to follow.
- Prefer placing an orchestration method before its supporting methods
  when introducing a new flow. Preserve existing class structure, keep
  related getters and actions together, and respect initialization order.
- Keep extracted code close to its owner and preserve MobX action
  boundaries, including observable updates after asynchronous operations.
- Normally, only one component, model or store is defined per file. Multiple components per file are ok when they are small, closely related, not exported and don't have logic of their own (so no hooks, no state, no side effects). Otherwise split them into separate files and import them.
- When a component needs to import dedicated subcomponents, put them in a folder named after the component, with an `index.tsx` and a `styles.module.scss` file.
- When shared styles are needed, import them from the parent folder's `styles.module.scss` file. Avoid global CSS and inline styles.
- Declare class fields explicitly. Do not use TypeScript constructor parameter properties (public, protected, private, or readonly on constructor parameters). Declare each field in the class body and assign it explicitly in the constructor.
- Use `clsx` for conditional class names. Avoid inline styles and global CSS.
- private methods should be located after public methods at the bottom of the class.

For example, this method inside `PermissionStore` expresses the decision
to update or create a permission. Persistence and collection updates stay
in the model and store methods it calls:

```ts
@action
createOrUpdateUserPermission(documentRootId: string, user: User, access: Access) {
    const existingPermission = this.userPermissionsByDocumentRoot(documentRootId).find(
        (permission) => permission.userId === user.id
    );
    if (existingPermission) {
        return existingPermission.setAccess(access);
    }
    return this.createUserPermission(documentRootId, user, access);
}
```

## Make the intent explicit

- Use well-named intermediate variables and functions to name what a piece of code computes, instead of long expressions or comments.
- Group related lines together with line breaks, and use `{}` blocks when it helps.
- Prefer pure functions, that compute a result from their arguments, over functions with side effects.

## Comments

- Don't comment code that is self-explanatory: when the names, the signature or the code already say it, add no comment.
- Comment the code that is weird, unexpected or surprising (a workaround, a non-obvious constraint, an order that matters): that's where readers need one.
- Keep comments short, one line when possible. Point to the details instead of writing them out: link the issue, PR, documentation or upstream bug that explains them.

```ts
// Uniqueness is guaranteed by the api, let's not check it again here.
// See https://github.com/GBSL-Informatik/teaching-dev/pull/328
```

## Readability over micro-optimizations

Unless the code is on a hot path where performance matters, favor readability over micro-optimizations and clever one-liners. Iterating over a list several times with well-named steps is fine when the list is small.
