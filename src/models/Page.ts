/**
 * A Markdown or MDX Page
 */

import { action, computed, observable, ObservableSet } from 'mobx';
import { PageStore } from '@tdev-stores/PageStore';
import TaskState from '@tdev-models/documents/TaskState';
import _ from 'lodash';
import iDocument from '@tdev-models/iDocument';
import StudentGroup from '@tdev-models/StudentGroup';
import Storage from '@tdev-stores/utils/Storage';

export default class Page {
    readonly store: PageStore;
    readonly id: string;

    @observable.ref accessor primaryStudentGroup: StudentGroup | undefined = undefined;
    @observable.ref accessor _activeStudentGroup: StudentGroup | undefined = undefined;

    documentRootIds: ObservableSet<string>;

    constructor(id: string, store: PageStore) {
        this.id = id;
        this.activeSolution = Storage.getUnsafe(`MINT-GUESS-${id}-S`);
        this.store = store;
        this.documentRootIds = observable.set<string>([id]);
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
    get taskStates(): TaskState[] {
        return this.documentRoots
            .flatMap((doc) => doc.firstMainDocument)
            .filter((d): d is TaskState => d instanceof TaskState)
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
        return this.store.loadAllDocuments(this);
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
            this.store.root.studentGroupStore.studentGroups.filter((sg) => !!sg.parentId),
            ['name'],
            ['asc']
        );
    }

    @computed
    get activeStudentGroup() {
        return this._activeStudentGroup || this.primaryStudentGroup;
    }

    @computed
    get taskStatesByUsers() {
        return _.groupBy(
            this.documentRoots
                .flatMap((dr) => dr.allDocuments)
                .filter((doc): doc is TaskState => doc instanceof TaskState)
                .filter((doc) => doc.isMain && doc.root?.meta.pagePosition)
                .filter((doc) =>
                    this.activeStudentGroup ? this.activeStudentGroup.userIds.has(doc.authorId) : true
                )
                .sort((a, b) => a.root!.meta.pagePosition - b.root!.meta.pagePosition),
            (doc) => doc.authorId
        );
    }

    /* MINT STUFF */
    @observable accessor activeSolution: string | undefined = undefined;

    lastGuessedAt() {
        return Storage.getUnsafe(`MINT-GUESS-${this.id}-T`, Date.now())!;
    }

    @action
    flipOption(label: string, nextGuessIn: number) {
        const now = Date.now();
        if (this.activeSolution === label) {
            this.activeSolution = undefined;
            Storage.setUnsafe(`MINT-GUESS-${this.id}-S`, undefined);
            return;
        } else {
            if (now >= this.lastGuessedAt() + nextGuessIn) {
                this.activeSolution = label;
                Storage.setUnsafe(`MINT-GUESS-${this.id}-S`, label);
                Storage.setUnsafe(`MINT-GUESS-${this.id}-T`, now);
            }
        }
    }
}
