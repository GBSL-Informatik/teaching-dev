---
page_id: 7ee4ffb1-ae9c-4ccd-ba84-0cf1442cc2d9
---
# Chapter 10: CMS Integration

In the preceding chapter ([Chapter 9: Socket.IO](09_socket_io_.md)), we explored how Socket.IO enables real-time communication to keep client application state synchronized. We now shift focus to a specialized subsystem for managing content that doesn't primarily reside in the application's relational database: **CMS Integration**.

While the core application manages dynamic, user-specific content and relationships via the `Document`/`DocumentRoot` model ([Chapter 2: Document](02_document_.md), [Chapter 3: Document Root](03_document_root_.md)), static or semi-static content like application documentation, landing pages, or course materials structured as Markdown/MDX files are often better suited for a version-controlled workflow (Git). The CMS Integration addresses the need to edit these files directly from the web interface, providing a custom content management workflow built around a configured GitHub repository.

Consider the use case of an administrator wanting to quickly fix a typo in the application's public documentation or update instructions for a course exercise, where this content is stored as a Markdown file in a specific GitHub repository. Instead of requiring the admin to clone the repo, edit the file locally, commit, push, and create a PR, the CMS integration allows this entire process to happen within the web application's UI.

## Concept

The CMS Integration component provides a dedicated frontend area enabling privileged users to browse, view, edit, and manage files (specifically Markdown/MDX and static assets) residing in a specified GitHub repository. This repository is configured in the Docusaurus `siteConfig` (`docusaurus.config.ts`) and defaults to the repository hosting the Docusaurus site itself.

Key aspects:

*   **GitHub as Content Source:** The configured GitHub repository acts as the backend for this content.
*   **GitHub API Interaction:** The frontend interacts directly with the GitHub REST API (using Octokit) to fetch repository contents, read file data, create commits, manage branches, and create/manage Pull Requests.
*   **Dedicated Frontend State:** A separate set of MobX stores and models ([Chapter 8: MobX Store Pattern](08_mobx_store_pattern_.md)) manage the state of the GitHub repository data (file tree, branches, PRs) and the editor state.
*   **User Authentication/Authorization (GitHub):** Users require separate authentication with GitHub (using OAuth) and must have appropriate permissions (read/write/admin) on the target repository to use the CMS features. This is distinct from the main application's authentication ([Chapter 1: User](01_user_.md)).
*   **Workflow:** The typical workflow involves selecting a branch (often creating a new one from the default), editing files, saving changes (which creates a commit on the selected branch), and optionally creating a Pull Request to merge changes back into the main branch.
*   **File/Directory Representation:** Frontend models represent GitHub directories, files (text-based like Markdown/MDX or binary like images), branches, and pull requests.

This system does **not** use the core `Document` or `DocumentRoot` abstractions ([Chapter 2: Document](02_document_.md), [Chapter 3: Document Root](03_document_root_.md)) for the content it manages, as that content's lifecycle and storage mechanism are fundamentally different (Git repository vs. application database).

## Solving the Use Case: Editing a Markdown File

Let's trace the process of an admin editing a Markdown file from the CMS UI.

1.  **Accessing the CMS:** The user navigates to a dedicated `/cms` route. This route requires successful application authentication ([Chapter 1: User](01_user_.md)) and, crucially, successful GitHub OAuth authentication (`gh-login.tsx`, `gh-callback.tsx`).
    ```typescript file=teaching-dev/src/context/storeContext.tsx highlight=27,28
    // teaching-dev\src\context\storeContext.tsx (Snippet)
    import { RootStore } from '@tdev-stores/rootStore';
    import React from 'react';
    import { enableStaticRendering } from 'mobx-react-lite';
    import { reaction } from 'mobx';
    import { SessionStore } from '@tdev-stores/SessionStore';

    // ... hydration logic ...

    export const rootStore = Object.freeze(new RootStore());
    export const storesContext = React.createContext(rootStore);
    export const StoresProvider = storesContext.Provider;
    // ... hooks ...
    ```
    The `RootStore` houses the `CmsStore`.
    ```typescript file=teaching-dev/src/stores/CmsStore.ts highlight=32,33,34
    // teaching-dev\src\stores\CmsStore.ts (Snippet)
    // ... imports ...
    import Github from '@tdev-models/cms/Github';
    // ... other imports ...

    export class CmsStore extends iStore<'logout' | `update-settings` | `load-settings` | `load-token`> {
        // ... observables ...
        @observable.ref accessor github: Github | undefined; // Manages GitHub API interaction
        // ... constructor ...

        @action
        fetchAccessToken(code: string) { /* ... API call to exchange OAuth code for token ... */ }

        @action
        logoutGithub() { /* ... API call to clear session token ... */ }

        @action
        clearAccessToken() { // Clears client-side state
            this.github = undefined;
            this.settings = undefined; // Settings contains the access token
        }
        // ... loadSettings, saveSettings handlers ...
    }
    ```
    The `CmsStore` manages the GitHub authentication state and holds the main `Github` model which wraps the Octokit client.
    ```typescript file=teaching-dev/src/pages/gh-login.tsx highlight=27,31
    // teaching-dev\src\pages\gh-login.tsx (Snippet)
    // ... imports ...
    import { useGithubAccess } from '@tdev-hooks/useGithubAccess'; // Hook to get GitHub access state

    const GhLogin = observer(() => {
        const access = useGithubAccess(); // Checks if GitHub token is available and valid
        const userStore = useStore('userStore');

        // Redirects if GitHub token is already valid AND application user is logged in
        if (access === 'access' && userStore.current) {
            return <Redirect to={'/cms'} />;
        }
        // Shows a loader if GitHub token state is being checked
        if (access === 'loading') {
            return (
                 /* ... Loader UI ... */
            );
        }
        // Provides a link to initiate the GitHub OAuth flow otherwise
        return (
             /* ... GitHub Login Link UI ... */
        );
    });
    ```
    The `useGithubAccess` hook (and underlying logic) checks if a valid GitHub access token exists in the user's application settings document. If not, the user is redirected to `/gh-login`. The `/gh-login` page initiates the GitHub OAuth flow, redirecting to GitHub, which then redirects back to `/gh-callback` with a code. The `/gh-callback` page exchanges this code for a token via the backend API and stores it in the user's settings. This token is then used by the frontend `CmsStore` to instantiate the `Github` interaction model (`Octokit`).

2.  **Browsing and Selecting File:** Once authenticated with GitHub, the CMS UI (`components/Cms/index.tsx`) loads. It displays a file tree representation of the configured GitHub repository's contents, branching options, and active Pull Requests.
    ```typescript file=teaching-dev/src/components/Cms/index.tsx highlight=12,13,19,20,21,22,24,25
    // teaching-dev\src\components\Cms\index.tsx (Snippet)
    // ... imports ...
    import { useStore } from '@tdev-hooks/useStore';
    import { useGithubAccess } from '@tdev-hooks/useGithubAccess';
    // ... other imports ...
    import Directory from '@tdev-components/Cms/MdxEditor/Directory'; // Component to display directories/files

    const CmsLandingPage = observer(() => {
        const userStore = useStore('userStore');
        const cmsStore = useStore('cmsStore'); // Access CmsStore
        const access = useGithubAccess(); // Check GitHub access status

        // Redirection/Loading based on access state and data loading
        if (access === 'no-token' || !userStore.current) { return <Redirect to={'/gh-login'} />; }
        if (access === 'loading' || !cmsStore.settings || !cmsStore.github || !cmsStore.rootDir) {
             return <Loader label="Laden..." />; // Wait for settings, github client, and root dir to load
        }

        // Access data from cmsStore and github model
        const { github } = cmsStore;

        return (
             /* ... UI Layout ... */
             <div className={clsx(styles.fileTree, viewStore.showFileTree && styles.showFileTree)}>
                 {/* rootDir is observable model representing the repo root folder */}
                <Directory
                    dir={cmsStore.rootDir} // Pass the root Dir model to the Directory component
                     /* ... styling props ... */
                />
             </div>
             /* ... other UI (Editor, PRs, Branches) ... */
        );
    });
    ```
    The `CmsLandingPage` component uses `cmsStore.rootDir` (an observable `Dir` model fetched by `cmsStore.github`) to render the interactive file tree. Clicking on a file or directory in the `Directory` component updates observable state in `cmsStore.settings` (the `activePath`) and potentially triggers fetching file/directory contents.

3.  **Editing File Content:** When a file (e.g., a Markdown file) is selected, `cmsStore.fetchFile` is called, which delegates to `cmsStore.github.fetchFile`. This fetches the content via the GitHub API. An appropriate editor component (like `DefaultEditor` for text) is displayed.
    ```typescript file=teaching-dev/src/components/Cms/Github/DefaultEditor/index.tsx highlight=28,29
    // teaching-dev\src\components\Cms\Github\DefaultEditor\index.tsx (Snippet)
    // ... imports ...
    import File from '@tdev-models/cms/File'; // Frontend File model
    import { action } from 'mobx';
    import CodeEditor from '@tdev-components/shared/CodeEditor'; // Generic Code/Text Editor

    interface Props { file: File; }

    const DefaultEditor = observer((props: Props) => {
        const { file } = props;
        if (!file || file.type !== 'file') { return null; } // Only shows for File models

        return (
             /* ... Header with actions/path ... */
             <CodeEditor
                lang={file.extension} // Hint for syntax highlighting
                defaultValue={file.content} // Initial content from the File model
                maxLines={60}
                // Update observable content on the File model when editor changes
                onChange={action((code) => file.setContent(code))}
            />
        );
    });
    ```
    The `DefaultEditor` component receives a `File` model. It displays the model's `content` in an editor and updates the `file.content` observable property via `onChange`.

4.  **Saving Changes:** When the user initiates a save (e.g., clicking a save button in `EditorNav`), an action on the `File` model or `CmsStore` is triggered. This action calls `cmsStore.github.saveFile`.

    ```typescript file=teaching-dev\src\models\cms\File.ts highlight=51,52,53,54
    // teaching-dev\src\models\cms\File.ts (Snippet)
    import BinFile from './BinFile';
    import FileStub from './FileStub';
    import { iFile } from './iFile';
    // ... other imports ...

    class File extends iFile { // Inherits from base file model
        // ... observable properties (content, etc.) ...

        @action
        async save() {
             // uses withApiState (from iEntry base) to track API loading state
            return this.withApiState(async () => {
                // Call the GitHub model (via CmsStore -> Github instance)
                const savedFile = await this.store.github!.saveFile(this);
                // Update local state if successful, maybe clear dirtiness
                 /* ... update this model props with savedFile data... */
            }).catch(this.onError); // Handle errors
        }
        // ... other methods ...
    }
    ```
    The `File.save` action calls `this.store.github.saveFile`.
    ```typescript file=teaching-dev\src\models\cms\Github.ts highlight=289,290,291,292,293,294,306,307,308
    // teaching-dev\src\models\cms\Github.ts (Snippet)
    // ... imports ...
    import { Octokit, RestEndpointMethodTypes as GhTypes } from '@octokit/rest'; // GitHub API client
    // ... other imports ...

    class Github {
        // ... observables (entries, branches, PRs, etc.) ...
        @observable.ref accessor octokit: Octokit; // The instantiated client

        constructor(accessToken: string, store: CmsStore) {
            this.store = store;
            this.octokit = new Octokit({ auth: accessToken }); // Authenticated with the user's token
        }

        // ... fetch methods ...

        @action
        saveFile(file: FileModel, commitMessage?: string) {
             // Converts content to base64 and calls createOrUpdateFile
            return this.createOrUpdateFile(file.path, file.content, file.branch, file.sha, commitMessage);
        }

        @action
        createOrUpdateFile(
            path: string,
            content: string | Uint8Array, // Content from the editor
            branch: string,
            sha?: string, // Existing SHA if updating
            commitMessage?: string
        ) {
             // github.repos.createOrUpdateFileContents is the Octokit method
             // It handles fetching the latest blob SHA, creating a new blob,
             // creating a new tree reflecting the file change, and creating a new commit.
            return this.octokit!.repos.createOrUpdateFileContents({
                owner: this.store.repoOwner,
                repo: this.store.repoName,
                path: path,
                message: commitMessage || (sha ? `Update: ${path}` : `Create ${path}`),
                content: /* base64 encoded content */, // Actual implementation does base64 conversion
                branch: branch,
                sha: sha, // Pass the existing file SHA if updating
            })
            .then(action((res /* ... API response ... */) => {
                // Update the local file model with the new SHA and timestamp from the response
                const resContent = /* ... validate response */;
                if (resContent) {
                    // Update the local model in the observable tree with results from the API
                    const file = Github.NewFileModel(resContent, content, this.store);
                     // This updates the observable entry in this.entries map
                    this._addFileEntry(branch, file);
                    file.setEditing(true); // Keep editor open
                    return file; // Return the updated model
                }
            }))
             /* ... error handling ... */
        }
        // ... other GitHub API interaction methods ...
    }
    ```
    The `Github` model, initialized with an `Octokit` instance authenticated via the user's GitHub token, performs the actual API calls. `createOrUpdateFile` uses `this.octokit.repos.createOrUpdateFileContents`, which is the high-level GitHub API method for saving a file. It handles the complex Git operations (fetching blob, creating blob, creating tree, creating commit) under the hood. Upon success, the response includes the new file SHA and metadata, which are used to update the corresponding observable `File` model instance in the `CmsStore.github.entries` map.

5.  **Creating a Pull Request:** After saving changes to a non-default branch, the user can create a Pull Request using the UI. This calls `cmsStore.github.createPR`.
    ```typescript file=teaching-dev\src\models\cms\Github.ts highlight=312,313,314,315,316,317,318,319,320
    // teaching-dev\src\models\cms\Github.ts (Snippet)
    // ... imports ...

    class Github { /* ... */
        @observable.array accessor PRs = observable.array<PR>([]); // Observable collection of PR models
        // ... constructor/methods ...

        @action
        createPR(branch: string, title: string, body?: string) {
            if (!this.defaultBranchName) { return Promise.resolve(); }
            return this.octokit.pulls
                .create({ // Octokit method to create a PR
                    owner: this.store.repoOwner,
                    repo: this.store.repoName,
                    title: title,
                    head: branch, // The branch with the changes
                    base: this.defaultBranchName, // The branch to merge into (e.g., main)
                    body: body
                })
                .then(action((res) => {
                    const pr = new PR(res.data, this); // Create a new PR model from the response
                    this._addPr(pr); // Add the new PR model to the observable collection
                    return pr; // Return the new PR model
                }));
        }
        // ... mergePR, closePr, deleteBranch etc methods ...
    }
    ```
    `createPR` uses the Octokit `pulls.create` method. Upon success, a new `PR` model is created from the API response data and added to the `cmsStore.github.PRs` observable array, updating the UI that lists PRs.

## Internal Walkthrough: Saving a File to GitHub

This walkthrough focuses on the data flow and API calls when a user clicks 'Save File' in the CMS editor *after* having already selected a branch and made changes.

```mermaid
sequenceDiagram
    participant UI as CMS Editor Component
    participant Frontend Model as File Model (MobX)
    participant CmsStore as CmsStore (MobX)
    participant Github Model as Github Model (MobX)
    participant Frontend HTTP as Browser (Fetch/Axios)
    participant Backend API as Backend (Express)
    participant GitHub API as GitHub API (api.github.com)

    UI->Frontend Model: file.save() (Button click)
    Frontend Model->CmsStore: Access store via file.store
    CmsStore->Github Model: cmsStore.github.saveFile(file)
    Github Model->Github Model: Prepare API call (endpoint, headers with token)
    Github Model->GitHub API: HTTP Request (PUT to /contents/:path, payload: content, branch, sha)<br>Authenticated via GitHub OAuth token (direct)
    alt GitHub OAuth Token is Valid
        GitHub API->GitHub API: Authenticate request using token
        GitHub API->GitHub API: Perform Git operations (fetch blob, create blob, create tree, create commit)
        GitHub API-->Github Model: 200/201 OK, Response data (new file SHA, commit details)
        Github Model->Github Model: Process response data<br>(Validate, format)
        Github Model->CmsStore: Inform CmsStore (e.g., implicitly via model updates)
        CmsStore->CmsStore: _addFileEntry (action)<br>(Update observable File Model in tree)
        CmsStore-->>UI: (MobX Reaction) UI updates (e.g., clear dirty state, show status)
    else GitHub OAuth Token is Invalid/Expired
        GitHub API-->Github Model: 401/403 Error
        Github Model--xUI: Reject Promise (Error handling)
        UI->UI: Show error message
        Note over UI: Prompt user to re-login Github
    end
```
This diagram shows the direct interaction between the frontend `Github` model (using Octokit) and the GitHub API after the `saveFile` action. The backend is involved only in the initial GitHub OAuth token exchange (`fetchAccessToken` earlier in the flow), but subsequent Git operations in the CMS workflow typically bypass the main application backend API for efficiency and direct access from the client authenticated with GitHub's token. The MobX store/model pattern ensures the UI updates reactively based on the success/failure and response data from the GitHub API call.

## Internal Implementation Details

### GitHub Authentication Flow (Frontend & Backend)

The GitHub CMS requires a separate authentication flow from the main application login.

```typescript file=teaching-dev\src\pages\gh-login.tsx highlight=10,11,12,13,14,15
// teaching-dev\src\pages\gh-login.tsx (Snippet - Authentication Initiation)
// ... imports ...
import siteConfig from '@generated/docusaurus.config'; // Docusaurus config
// ... other imports ...

const { APP_URL } = siteConfig.customFields as { APP_URL?: string };
const callback = `${APP_URL || 'http://localhost:3000'}/gh-callback`; // Callback URL for OAuth flow
const LOGIN_URL =
    `https://github.com/login/oauth/authorize?client_id=Iv23ligDNwu0p1z92UTe&scope=repo&redirect_uri=${encodeURIComponent(callback)}` as const; // GitHub OAuth URL

const GhLogin = observer(() => { /* ... UI ... */ });
```
The login URL is constructed using the configured frontend URL, a GitHub OAuth App Client ID (hardcoded here, sensitive), and the necessary `scope` (`repo` for read/write access).
```typescript file=teaching-dev\src\pages\gh-callback.tsx highlight=13,14,16,17,18
// teaching-dev\src\pages\gh-callback.tsx (Snippet - OAuth Callback)
import React from 'react';
// ... imports ...
import { useStore } from '@tdev-hooks/useStore';
import { useLocation } from '@docusaurus/router';

const GhCallback = observer(() => {
    const cmsStore = useStore('cmsStore');
    const location = useLocation();
    const history = useHistory();
    const code = new URLSearchParams(location.search).get('code'); // Extract the 'code' from URL query params

    React.useEffect(() => {
        if (code) {
             // Call CmsStore action to exchange the code for an access token via the backend
            cmsStore.fetchAccessToken(code);
            // Replace history state to prevent going back to the code-containing URL
            history.replace('/gh-callback');
        }
    }, [history]);

     // Redirect logic based on whether code is present or access has been granted
     /* ... Redirect UI ... */
});
```
The callback page extracts the temporary `code` provided by GitHub and passes it to `cmsStore.fetchAccessToken`.
```typescript file=teaching-dev\src\stores\CmsStore.ts highlight=145,146,147,148,149,150,151,152,153,154,155
// teaching-dev\src\stores\CmsStore.ts (Snippet - Token Exchange in Store)
// ... imports ...
import {
    githubToken as apiGithubToken, // Backend API call
     // ... other cms api endpoints
    CmsSettings,
    FullCmsSettings
} from '@tdev-api/cms';
// ... other imports ...

export class CmsStore extends iStore<`logout` | `update-settings` | `load-settings` | `load-token`> {
    // ... observables ...
    @observable.ref accessor settings: Settings | undefined; // Stores Settings model, incl. token

    // ... constructor ...

    @action
    fetchAccessToken(code: string) {
         // Use iStore's helper for API call state management
        return this.withAbortController(`load-token`, (ct) => {
             // Call the backend API endpoint to exchange the code for a token
            return apiGithubToken(code, ct.signal)
                .then(
                    action(({ data }) => {
                         // The backend returns the CmsSettings object including token/expiry
                        if (data && data.token && data.tokenExpiresAt) {
                             // Handle the response, store settings, Initialize GitHub client
                            this.handleSettingsChange(data);
                            return this.settings; // Return the Settings model
                        }
                        return null; // Indicate failure if token/expiry are missing
                    })
                )
                .catch((err) => {
                     // Log and return null on error
                    console.error(err);
                    // Optionally clear state or redirect to login on error
                    return null;
                });
        });
    }

    @action
    handleSettingsChange(data: Partial<CmsSettings>) {
        // Creates/updates the PartialSettings and Settings models
        this.partialSettings = new PartialSettings(data as CmsSettings, this);
         // If token and expiry are present, create/update the full Settings model
        if (data.token && data.tokenExpiresAt) {
            this.settings = new Settings(data as FullCmsSettings, this);
             // If settings contain a token, initialize the Github model (Octokit)
            if (this.settings.token) {
                this._initializeGithub();
            }
            return this.settings;
        } else {
             // If token is missing, clear the state
            this.clearAccessToken();
        }
        return null;
    }

    @action
    _initializeGithub() { // Called after token is successfully stored
         if (!this.settings || this.settings.isExpired || this.github) {
            return;
        }
         // Instantiate the Github model, passing the fetched access token to its constructor
        this.github = new Github(this.settings.token, this);
        this.github.load(); // Trigger initial data load (repo, branches, PRs)
    }
    // ... other methods ...
}
```
The `CmsStore` uses its `fetchAccessToken` action to call a backend API endpoint (`apiGithubToken`). This endpoint (not shown but exists in the project) receives the OAuth code, exchanges it for an access token using GitHub's server-to-server API, and stores this token (securely encrypted) along with its expiry in the user's `CmsSettings` `Document` ([Chapter 2: Document](02_document_.md)). The backend returns this `CmsSettings` object to the frontend. `handleSettingsChange` processes this, creating a `Settings` model instance (which holds the encrypted token and expiry). If valid token info is present, `_initializeGithub` is called, instantiating the `Github` model with the fetched token, allowing it to make authenticated requests *directly* to the GitHub API using `Octokit`.

This hybrid flow ensures the sensitive token exchange happens securely on the backend, but the bulk of the potentially frequent Git operations (fetching tree, file content, saving files) happen client-side authenticated by this token.

### Frontend Modeling of GitHub Concepts

Distinct MobX models represent GitHub entities like files, directories, branches, and PRs, providing observable state and logic.

```typescript file=teaching-dev\src\models\cms\File.ts highlight=8,11,14,19,24
// teaching-dev\src\models\cms\File.ts (Snippet - File Model)
import { action, computed, makeObservable, observable } from 'mobx';
import { iEntry, iEntryProps } from './iEntry'; // Base class for all tree entries
import { CmsStore } from '@tdev-stores/CmsStore';
import { Github } from './Github'; // Need type hint for store.github

export interface FileProps extends iEntryProps {
    content: string; // Specific to text files
    encoding?: 'base64'; // Indicates encoding if content is base64
    isMarkdown?: boolean;
}

class File extends iEntry { // Extends iEntry representing tree nodes
    @observable accessor content: string; // Editable file content is observable
    @observable accessor encoding?: 'base64';

    @observable accessor _pristineContent: string; // Store last saved content for dirtiness check
    @observable accessor isMarkdown?: boolean;

    constructor(props: FileProps, store: CmsStore) {
        super(props, store, 'file'); // 'file' indicates type
        this.content = props.content;
        this._pristineContent = props.content;
        this.encoding = props.encoding;
        this.isMarkdown = props.isMarkdown;
        // ... makeObservable and other init ...
    }

    // Computed property to check if content has changed
    @computed get isDirty() { return this.content !== this._pristineContent; }

    // Action to update content and clear dirtiness on Save success
    @action setContent(content: string) { this.content = content; }
    @action setPristine(content: string) { this._pristineContent = content; }

    @action
    save() { /* ... calls store.github.saveFile */ }
    // ... delete, etc. actions ...
}
```
The `File` model extends a base `iEntry` (for common tree node properties like path, branch, parent) and adds specific observable properties like `content` and `_pristineContent` for tracking changes. The `isDirty` computed property leverages MobX to efficiently track if the current content differs from the last saved version. Actions like `setContent` mutate the observable state, and `save` orchestrates the API call. `Dir`, `Branch`, `PR`, `FileStub`, and `BinFile` follow a similar pattern, modeling their respective GitHub entities.

### Fetching Repository Structure

The `Github` model manages fetching repository contents and metadata using Octokit.

```typescript file=teaching-dev\src\models\cms\Github.ts highlight=385,386,387,388,389,390,391,392,398,399,404,405,406
// teaching-dev\src\models\cms\Github.ts (Snippet - Fetching Directory)
// ... imports ...
import Dir from './Dir';
import FileStub from './FileStub';
import BinFile from './BinFile';
// ... other imports ...

class Github { /* ... */
    // Observable map where key is branch name, value is observable array of Dir/File/Stub models
    entries = observable.map<string, IObservableArray<Dir | FileModel | BinFile | FileStub>>([], {
        deep: false
    });
    // ... fetchRepo, fetchBranches, fetchPRs ...

    @action
    fetchDirectory(branch: string, path: string = '', force: boolean = false) {
        const before = this.store.repoKey;
        return this.octokit.repos
            .getContent({ // Octokit method for fetching directory contents (or a single file)
                owner: this.store.repoOwner,
                repo: this.store.repoName,
                path: path,
                ref: branch, // Specify the branch
                _: Date.now() // Cache buster
            })
            .then(
                action((res) => {
                     // Check if the repo/branch context changed during async operation
                    if (before !== this.store.repoKey) { return []; }

                     // Handle response - expects an array of entries for a directory
                    if (Array.isArray(res.data)) {
                        // Process the list of entries, create models, add to observable map
                       this._handleDirectoryResponse(res.data, branch, true, force); // internal helper
                        const dir = this.store.findEntry(branch, path) as Dir | undefined;
                        if (dir) { dir.setIsFetched(true); } // Mark directory as fetched
                        return this.store.findChildren(branch, path); // Return child entries (reactive)
                    } else {
                         // Handle case where path was a file, not a directory
                         // (getContent returns entry data for a file too)
                        console.warn(`Expected directory, got file for path ${path} on branch ${branch}`);
                        return [];
                    }
                })
            ) /* ... Error handling ... */ ;
    }

    @action
    _handleDirectoryResponse( entries: GhTypes['repos']['getContent']['response']['data'], branch: string, loadRecursive: boolean, force: boolean ) {
         if (!Array.isArray(entries) || entries.length === 0) { return []; }
         // Ensure observable array exists for this branch, add root dir if needed
         if (!this.entries.has(branch)) {
             this.entries.set(branch, observable.array([this._createRootDir(branch)], { deep: false }));
         }
         const arr = this.entries.get(branch)!;

         entries.forEach((entry) => {
            // Add/Update existing entries in the observable array based on SHA/path
            const old = arr.find((e) => e.path === entry.path);
              /* ... logic to update or remove old, create new models (Dir, FileStub) ... */
            if (entry.type === 'dir') {
                const dir = new Dir(entry, this.store); /* ... */ arr.push(dir);
            } else if (entry.type === 'file') {
                 // Start with a FileStub (just metadata), content fetched later if needed
                 const fstub = Github.NewFileModel(entry, undefined, this.store); /* ... */ arr.push(fstub);
            }
         });
         // Optionally, recursively fetch subdirectories
         if (loadRecursive && entries.length > 0) {
             // Call fetchDirectoryTree which calls fetchDirectory for subdirs
             this.fetchDirectoryTree(this.store.findEntry(branch, entries[0].path)!);
         }
    }
    // ... fetchFile (fetches file content), fetchRawContent (fetches blob) ...
}
```
`fetchDirectory` calls `octokit.repos.getContent` with `path` and `ref` (branch). For directories, this returns an array of entries. `_handleDirectoryResponse` processes this array, creating `Dir` or `FileStub` models and adding them to the `entries` observable map, organized by branch. Note that for efficiency, file content is *not* fetched automatically; only metadata (`FileStub`) is loaded initially. Content is fetched on demand when a file is selected for viewing/editing (`fetchFile`/`fetchRawContent`).

## Conclusion

The CMS Integration subsystem provides a dedicated, Git-workflow-centric approach to managing static and semi-static content within the `teaching-project`. By leveraging the GitHub API directly from the frontend (authenticated via a backend-managed OAuth token), it enables privileged users to browse, edit, and manage files, branches, and pull requests within a configured repository. This functionality is segregated from the core application data model (`Document`/`DocumentRoot`) and relies on a separate structure of MobX stores and models to manage the state of GitHub entities. This specialization provides a powerful tool for maintaining content that is naturally version-controlled.

---

Generated by [AI Codebase Knowledge Builder](https://github.com/The-Pocket/Tutorial-Codebase-Knowledge)
