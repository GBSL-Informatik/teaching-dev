# Repository Guidelines

## Project Structure & Module Organization

Teaching Dev is a Docusaurus teaching platform using React, TypeScript, MobX, and Yarn workspaces.

- `src/` contains shared components, hooks, models, stores, API clients, themes, and remark plugins.
- `packages/` contains workspace packages, scoped to either the platform `packages/tdev/` or individual devs, e.g. `packages/hfr/`.
- `docs/`, `blog/`, and `static/` hold content and assets; `website/` contains site customizations and should never be touched in the tdev repository.
- `tdev-website/` contains the platform documentation site and its overrides.
- `updateSync/` contains synchronization tools. Tests live in nearby `tests/` directories.

## Build, Test, and Development Commands

Use Node.js 24.13 or newer (`.nvmrc` pins 24.13.0) and Yarn. Run commands from the repository root.

- `yarn install`: install workspace dependencies.
- `yarn run start`: start Docusaurus and the package-documentation watcher.
- `yarn build`: synchronize materials and package documentation, then build the static site.
- `yarn serve`: preview the production build.
- `yarn typecheck`: run TypeScript checks.
- `yarn test --run`: run Vitest once with V8 coverage; `yarn test` enables watch mode.
- `yarn format:check` / `yarn format`: check or apply Prettier formatting.

## Coding Style & Naming Conventions

Follow existing TypeScript/TSX patterns and `.prettierrc`: four-space indentation, single quotes, semicolons, no trailing commas, and a 110-character print width. Markdown and MDX are excluded from repository-wide Prettier checks; format them consistently by hand.

Use PascalCase for components and classes, `useCamelCase` for hooks. Prefer configured `@tdev-*` import aliases and keep site-specific overrides in the appropriate `tdev-website/` directory.

New components should normally be put in an `index.tsx` alongside a `styles.module.css` file, where the folder is named after the component. Use `clsx` for conditional class names. Avoid inline styles and global CSS.

Use mobx for state management and only use local reactish component state for component-specific state that does not need to be shared or persisted after unmounting. Use `useStore` to access stores.

## Testing Guidelines

Use tests only for remark plugins or packages which are run from the cli. No tests for components, hooks, or stores. Use Vitest with descriptive `describe` and `it` blocks. Name tests `*.test.ts` under the relevant module's `tests/` directory. Plugin tests commonly use inline snapshots; review snapshot changes for intended output differences. No coverage threshold is configured.

## Commit & Pull Request Guidelines

Recent commits use short, imperative subjects such as `fix rename error reporting`; occasional prefixes such as `refactor:` also appear. Follow that style and keep commits focused.

In pull requests, describe the behavior change, link relevant issues, report validation commands, and include screenshots for visual changes. Ensure the Prettier CI check passes; pushes to `main` build and deploy to GitHub Pages. Add a postifx `(AI-Assisted)` to the PR title if AI tools were used to generate code or content.

## Configuration & Secrets

Use `.env.example` and the README to configure local settings. Keep credentials and tokens out of commits.

## Agent delegation

For complex tasks, delegate independent work to subagents:

- Use explorer to investigate relevant code and existing patterns.
- Use reviewer to review the completed changes.
- The main agent implements changes and runs validation.
- Avoid having multiple agents edit the same files.
- Keep simple tasks in the main agent