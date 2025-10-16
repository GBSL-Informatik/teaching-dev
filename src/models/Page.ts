/**
 * A Markdown or MDX Page
 */

import { action, computed, observable, ObservableSet } from 'mobx';
import { PageStore } from '@tdev-stores/PageStore';
import TaskState from '@tdev-models/documents/TaskState';
import _ from 'es-toolkit/compat';
import iDocument from '@tdev-models/iDocument';
import StudentGroup from '@tdev-models/StudentGroup';
import ProgressState from './documents/ProgressState';

export default class Page {
    readonly store: PageStore;
    readonly id: string;
    refetchTimestamps: number[] = [];

    @observable.ref accessor primaryStudentGroup: StudentGroup | undefined = undefined;
    @observable.ref accessor _activeStudentGroup: StudentGroup | undefined = undefined;
    documentRootIds: ObservableSet<string>;

    dynamicValues = observable.map<string, string>();

    constructor(id: string, store: PageStore) {
        this.id = id;
        this.store = store;
        this.documentRootIds = observable.set<string>([id]);
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
    addDocumentRoot(doc: iDocument<any>) {
        this.documentRootIds.add(doc.documentRootId);
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
        const group = this.store.root.studentGroupStore.findByName(name);
        this.setPrimaryStudentGroup(group);
    }

    @action
    setPrimaryStudentGroup(group?: StudentGroup) {
        if (
            group &&
            (group.id === this.primaryStudentGroup?.id ||
                this._activeStudentGroup?.parentIds.includes(group.id))
        ) {
            this.primaryStudentGroup = undefined;
            this._activeStudentGroup = undefined;
            return;
        }
        this.primaryStudentGroup = group;
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
        return [...(this.activeStudentGroup?.userIds || [])].filter((userId) => !editingStates[userId]);
    }
}
