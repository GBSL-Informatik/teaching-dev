# TDEV Changelog

## 5.8.2026
https://github.com/GBSL-Informatik/teaching-dev/pull/299

- [💥 Breaking] upgrade mobx@7 - `@observable.ref` is now `@observableRef` - make sure to update custom components accordingly. See the (simple) [migration guide](https://mobx.js.org/migrating-from-6-to-7.html) for completeness.
- [💅 Polish] The Ace Editor now tracks transient updates s.t. IME specific text deltas can be handled correctly.

## 4.8.2026

https://github.com/GBSL-Informatik/teaching-dev/pull/298

- [💥 Breaking] Make sure to add swizzled `src/theme/AnnouncementBar/index.tsx` wrapper for the Presentationmode to work. The latest [migration](packages/tdev/material-sync/src/migrate_tdev/migrations/2026-08-04-include-presentation-mode.ts) should already add this dependency.
- [💥 Breaking] In `iCode.ts` the methods `runCode` and `stopExecution` were updated. This affects brython-code and pyodide-code. Common `updateTdev` configs should handle this in most cases.
- [ℹ️ Info] `bryRunner.ts` was updated - ensure to update any swizzled components accordingly. (Affects only customized brython-code components).

## 9.7.2026
- [💥 Breaking] make sure the api uses `better-auth@^1.6.23`


## 8.7.2026
- [💥 Breaking] rename `@tdev-components/shared/util` (`src/components/shared/util`) to `@tdev-components-shared/utils` (`src/components/shared/utils`). Make sure to rename imports accordingly.
- [💥 Breaking] update `tsconfig.json` to work with typescript v7 (remove `baseUrl`)
    - add `tsconfig.docusaurus.json` to `updateTdev.config.yaml` (internalized since docusaurus v3.10.1 used `baseUrl`)
    - update `tsconfig.json`
    - update `tsconfig.tdev.json`




## Changelog Categories
- [ℹ️ Info]
- [🗾 Bugfix]
- [💥 Breaking]
- [💅 Polish]
- [🚀 Performance]