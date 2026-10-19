# Architecture

Teaching-Dev (tdev) is a static frontend codebase used together with the [teaching-api](https://github.com/GBSL-Informatik/teaching-api/) backend to load dynamic content. We utilize the latest ES6 language features, including `async`/`await`, and types.

## Frontend

Teaching-Dev's frontend is a React application on top of [Docusaurus](https://docusaurus.io/). It uses [MobX](https://mobx.js.org/) for state management and [Infima](https://infima.dev/) for styling components with scss-modules. Unless global, state logic and styles are always co-located with React components together with their subcomponents to make the component tree easier to manage.

Teaching-Dev is a framework for building educational platforms. It provides a set of React components, hooks, and stores to build a platform that can be used by multiple developers/teachers. The platform is built using TypeScript, React, MobX, and Yarn workspaces.

```
.
├── bin                 - reusable helper bash scripts, focused on creating educational content (e.g. to create an .mp4 from a video)
├── docs                - educational content from implementations of the teaching-dev platform - never put content here.
├── packages            - additional workspace packages, scoped to either the platform `packages/tdev/` or individual devs, e.g. `packages/hfr/`.
├── src
│   ├── api             - axios api endpoints
│   │   └── OfflineApi  - supports offline mode by caching API responses in IndexedDB or Memory
│   ├── components      - React components provided by the platform   
│       └── documents   - all components which display `document` records from the teaching-api  
│   ├── css             - global css files, e.g. for Infima overrides
│   ├── helpers         - helper functions, e.g. for date formatting
│   ├── hooks           - Reusable React hooks
│   ├── models          - State models using MobX observables
│   ├── pages           - docusaurus pages
│   ├── plugins         - remark- and rehype plugins for docusaurus, provided by the platform
│   ├── siteConfig      - docusaurus site configuration for implementing the platform
│   ├── stores          - MobX stores - collections of models and associated fetch logic
│   └── theme           - docusaurus theme overrides
├── static              - static assets
├── tdev-website        - the teaching-dev platform documentation site and its overrides. Documentation for the platform should be put here, not in the `docs/` folder.
└── website             - customizations and overrides from implementations of the teaching-dev platform. This folder should never be touched in the tdev repository.
```

`packages` are used to provide additional functionality to the platform. They are independent modules that can be added or removed without affecting the core functionality of the platform. Packages are configured in `siteConfig.ts` (or here in teaching-dev, in `tdev-website/siteConfig.ts`). Packages must be present before building the application and can not be dynamically loaded during runtime.