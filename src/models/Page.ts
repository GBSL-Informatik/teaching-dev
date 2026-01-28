/**
 * A Markdown or MDX Page
 */

import { action, computed, observable, ObservableSet } from 'mobx';
import { PageStore, SidebarVersions } from '@tdev-stores/PageStore';
import TaskState from '@tdev-models/documents/TaskState';
import _ from 'es-toolkit/compat';
import iDocument from '@tdev-models/iDocument';
import StudentGroup from '@tdev-models/StudentGroup';
import ProgressState from './documents/ProgressState';

interface PageTree {
    id: string;
    path: string;
    pages: PageTree[];
}

export default class Page {
    readonly store: PageStore;
    readonly id: string;
    readonly path: string;
    refetchTimestamps: number[] = [];

    @observable.ref accessor _primaryStudentGroupName: string | undefined = undefined;
    @observable.ref accessor _activeStudentGroup: StudentGroup | undefined = undefined;
    documentRootIds: ObservableSet<string>;

    dynamicValues = observable.map<string, string>();

    constructor(id: string, path: string, store: PageStore) {
        this.id = id;
        this.path = path;
        this.store = store;
        this.documentRootIds = observable.set<string>([id]);
    }

    @computed
    get isLandingpage() {
        return SidebarVersions.some((version) => version.entryPath === this.path);
    }

    @computed
    get tree(): PageTree {
        return {
            id: this.id,
            path: this.path,
            pages: this.subPages.map((page) => page.tree)
        };
    }

    @computed
    get parentPath() {
        const parts = this.path.split('/').slice(0, -2);
        while (parts.length > 1) {
            const parentPath = `${parts.join('/')}/`;
            const parentPage = this.store.pages.find((p) => p.path === parentPath);
            if (parentPage) {
                return parentPage.path;
            }
            if (SidebarVersions.some((v) => v.versionPath === parentPath)) {
                return parentPath;
            }
            parts.splice(-1, 1);
        }
        return '/';
    }

    @computed
    get subPages() {
        return this.store.pages.filter((page) => page.parentPath === this.path);
    }

    @action
    setDynamicValue(key: string, value?: string) {
        if (value === undefined) {
            this.dynamicValues.delete(key);
            return;
        }
        this.dynamicValues.set(key, value);
    }

    @action
    assertDocumentRoot(doc: iDocument<any>) {
        // this.documentRootIds.add(doc.documentRootId);
        if (process.env.NODE_ENV === 'production') {
            return;
        }
        if (!this.documentRootIds.has(doc.documentRootId)) {
            this.store.loadPageIndex(true);
        }
    }

    @action
    addDocumentRootId(id: string) {
        this.documentRootIds.add(id);
    }

    @computed
    get documentRoots() {
        return this.store.root.documentRootStore.documentRoots.filter(
            (doc) => this.documentRootIds.has(doc.id) && !doc.isDummy
        );
    }

    @computed
    get documents() {
        return this.documentRoots
            .flatMap((doc) => doc.firstMainDocument)
            .filter((d) => d?.root?.meta.pagePosition)
            .sort((a, b) => a!.root!.meta!.pagePosition - b!.root!.meta.pagePosition);
    }

    @computed
    get editingState(): (TaskState | ProgressState)[] {
        return this.documentRoots
            .flatMap((doc) => doc.firstMainDocument)
            .filter(
                (d): d is TaskState | ProgressState => d instanceof TaskState || d instanceof ProgressState
            )
            .filter((d) => d?.root?.meta.pagePosition)
            .sort((a, b) => a!.root!.meta!.pagePosition - b!.root!.meta.pagePosition);
    }

    @action
    setPrimaryStudentGroupName(name?: string) {
        this._primaryStudentGroupName = name;
    }

    @computed
    get primaryStudentGroup() {
        return this._primaryStudentGroupName
            ? this.store.root.studentGroupStore.findByName(this._primaryStudentGroupName)
            : undefined;
    }

    @action
    setPrimaryStudentGroup(group?: StudentGroup) {
        if (
            group &&
            (group.id === this.primaryStudentGroup?.id ||
                this._activeStudentGroup?.parentIds.includes(group.id))
        ) {
            this.setPrimaryStudentGroupName(undefined);
            this._activeStudentGroup = undefined;
            return;
        }
        this.setPrimaryStudentGroupName(group?.name);
        if (group) {
            this._activeStudentGroup = undefined;
        }
    }

    /**
     * loads all linked document roots (added by #addDocumentRoot)
     */
    @action
    loadLinkedDocumentRoots() {
        this.refetchTimestamps.push(Date.now());
        if (!this.store.root.userStore.isUserSwitched && this.documents.length > 0) {
            return;
        }
        return this.store.loadAllDocuments(this).catch((err) => {
            const now = Date.now();
            const ts = this.refetchTimestamps.filter((ts) => now - ts < 10_000);
            if (ts.length < 5) {
                setTimeout(() => this.loadLinkedDocumentRoots(), 500);
            }
            console.warn('Failed to load linked document roots for page', this, err);
        });
    }

    @action
    toggleActiveStudentGroup(studentGroup: StudentGroup) {
        if (this._activeStudentGroup && this._activeStudentGroup.id === studentGroup.id) {
            this._activeStudentGroup = undefined;
        } else {
            this._activeStudentGroup = studentGroup;
        }
    }

    @computed
    get childStudentGroups() {
        if (this.primaryStudentGroup) {
            return this.primaryStudentGroup.children;
        }
        return _.orderBy(
            this.store.root.studentGroupStore.managedStudentGroups.filter((sg) => !!sg.parentId),
            ['name'],
            ['asc']
        );
    }

    @computed
    get activeStudentGroup() {
        return this._activeStudentGroup || this.primaryStudentGroup;
    }

    @computed
    get editingStateByUsers() {
        return _.groupBy(
            this.documentRoots
                .flatMap((dr) => dr.allDocuments)
                .filter(
                    (d): d is TaskState | ProgressState =>
                        d instanceof TaskState || d instanceof ProgressState
                )
                .filter((doc) => doc.isMain && doc.root?.meta.pagePosition)
                .filter((doc) =>
                    this.activeStudentGroup ? this.activeStudentGroup.userIds.has(doc.authorId) : true
                )
                .sort((a, b) => a.root!.meta.pagePosition - b.root!.meta.pagePosition),
            (doc) => doc.authorId
        );
    }

    @computed
    get userIdsWithoutEditingState(): string[] {
        const editingStates = this.editingStateByUsers;
        const userIds = new Set<string>(
            this.activeStudentGroup?.userIds ||
                this.store.root.studentGroupStore.managedStudentGroups.flatMap((g) => [...g.userIds])
        );
        return [...userIds].filter((userId) => !editingStates[userId]);
    }
}
