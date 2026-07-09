# TDEV Changelog

## 9.7.2026
- [💥 Breaking] make sure the api uses `better-auth@^1.6.23`


## 8.7.2026
- [💥 Breaking] rename `@tdev-components/shared/util` (`src/components/shared/util`) to `@tdev-components-shared/utils` (`src/components/shared/utils`). Make sure to rename imports accordingly.
- [💥 Breaking] update `tsconfig.json` to work with typescript v7 (remove `baseUrl`)
    - add `tsconfig.docusaurus.json` to `updateTdev.config.yaml` (internalized since docusaurus v3.10.1 used `baseUrl`)
    - update `tsconfig.json`
    - update `tsconfig.tdev.json`




## Changelog Categories
- [🗾 Bugfix]
- [💥 Breaking]
- [💅 Polish]
- [🚀 Performance]