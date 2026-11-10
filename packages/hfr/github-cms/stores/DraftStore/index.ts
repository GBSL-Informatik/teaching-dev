import { action, computed, observable, reaction } from 'mobx';
import type File from '../../models/File';
import FileStub from '../../models/FileStub';
import type { CmsStore } from '../CmsStore';
import { type Draft, DraftDb, type DraftLocation } from './draftDb';

export interface BranchChanges {
    branch: string;
    /** the number of files with unsaved changes */
    count: number;
}

const draftKey = ({ repo, branch, path }: DraftLocation) => `${repo}:${branch}:${path}`;

const logError = (error: unknown) => console.error('Failed to persist unsaved changes', error);

/**
 * Keeps the unsaved changes of files in IndexedDB, so that they survive a reload.
 *
 * - While a file is dirty, its content is saved as draft, see `File.setContent`.
 * - When a file is loaded from github, its draft is applied, unless the file changed on github
 *   since: then the draft is dismissed, see `restore`.
 * - The files with drafts on the current branch are loaded, to apply or dismiss their drafts.
 *   Drafts of other branches are kept until their branch is opened.
 */
export class DraftStore {
    readonly store: CmsStore;
    @observable accessor isLoaded = false;
    private readonly db = new DraftDb();
    private readonly drafts = observable.map<string, Draft>([], { deep: false });

    constructor(store: CmsStore) {
        this.store = store;
        this.load();
        reaction(
            () => [this.isLoaded, this.store.github, this.store.activeBranchName] as const,
            ([isLoaded, github, branch]) => {
                if (isLoaded && github && branch) {
                    this.loadFilesOfBranch(branch);
                }
            }
        );
    }

    @computed
    get repoDrafts(): Draft[] {
        return [...this.drafts.values()].filter((draft) => draft.repo === this.store.repoKey);
    }

    @computed
    get changedBranches(): BranchChanges[] {
        const counts = new Map<string, number>();
        for (const { branch } of this.repoDrafts) {
            counts.set(branch, (counts.get(branch) ?? 0) + 1);
        }
        return [...counts].map(([branch, count]) => ({ branch, count }));
    }

    /** saves the changes of the file while it is dirty, removes them otherwise */
    @action
    sync(file: File) {
        if (!file.isDirty) {
            return this.remove(file.branch, file.path);
        }
        const draft: Draft = {
            repo: this.store.repoKey,
            branch: file.branch,
            path: file.path,
            baseSha: file.sha,
            content: file.content,
            savedAt: Date.now()
        };
        this.drafts.set(draftKey(draft), draft);
        this.db.put(draft).catch(logError);
    }

    /**
     * Applies the draft to a file loaded from github.
     * The draft of an outdated version of the file is dismissed.
     */
    @action
    restore(file: File) {
        const draft = this.drafts.get(this.keyOf(file.branch, file.path));
        if (!draft) {
            return;
        }
        if (draft.baseSha !== file.sha) {
            return this.remove(file.branch, file.path);
        }
        file.restoreContent(draft.content);
    }

    @action
    remove(branch: string, path: string) {
        const key = this.keyOf(branch, path);
        const draft = this.drafts.get(key);
        if (!draft) {
            return;
        }
        this.drafts.delete(key);
        this.db.delete(draft).catch(logError);
    }

    /** discards the changes of the branch, including the changes of its loaded files */
    @action
    discardBranch(branch: string) {
        for (const draft of this.draftsOfBranch(branch)) {
            const file = this.store.findEntry(branch, draft.path);
            if (file?.type === 'file') {
                file.reset();
            }
            this.remove(branch, draft.path);
        }
    }

    /** discards the changes of all branches, except of the current one, which is edited */
    @action
    discardOtherBranches() {
        for (const { branch } of this.changedBranches) {
            if (branch !== this.store.activeBranchName) {
                this.discardBranch(branch);
            }
        }
    }

    private draftsOfBranch(branch: string) {
        return this.repoDrafts.filter((draft) => draft.branch === branch);
    }

    private keyOf(branch: string, path: string) {
        return draftKey({ repo: this.store.repoKey, branch, path });
    }

    private load() {
        this.db
            .getAll()
            .then(
                action((drafts) => {
                    drafts.forEach((draft) => this.drafts.set(draftKey(draft), draft));
                    this.restoreLoadedFiles();
                })
            )
            .catch(logError)
            .finally(action(() => (this.isLoaded = true)));
    }

    /** the files loaded from github before the drafts were read */
    private restoreLoadedFiles() {
        for (const draft of this.repoDrafts) {
            const file = this.store.findEntry(draft.branch, draft.path);
            if (file?.type === 'file' && !file.isDirty) {
                this.restore(file);
            }
        }
    }

    /**
     * Loads the files with drafts, their drafts are applied or dismissed when they are added,
     * see `Github._addFileEntry`. When a file can not be loaded, its draft is kept.
     */
    private loadFilesOfBranch(branch: string) {
        for (const draft of this.draftsOfBranch(branch)) {
            // directory listings add the files as stubs, without their content
            const entry = this.store.findEntry(branch, draft.path);
            if (entry && entry.type !== 'file_stub') {
                continue;
            }
            const stub = entry ?? FileStub.DummyFile(draft.path, branch, this.store, false);
            this.store.github?.fetchFile(stub);
        }
    }
}
