import type { CodeType } from '@tdev-api/document';
import type CodeCommit from '@tdev-models/documents/CodeCommit';
import { CommitGraph, GraphNode, layoutCommitGraph } from '@tdev-models/helpers/commitGraph';
import { action, computed, observable } from 'mobx';
import type iCode from '.';
import LazyDocumentsOfType from './LazyDocumentsOfType';

/**
 * Id of the "initial code" node in the commit graph: the root of all commits.
 */
export const INITIAL_CODE_ID = 'initial';

/**
 * A node of the commit graph: a commit, or the initial code (without a commit).
 */
export interface CommitGraphNode extends GraphNode {
    commit?: CodeCommit;
}

/**
 * Explicit, immutable commits (`code_commit`) of a `commitable` code block.
 * Commits form a tree via their `parentId`; the code document points to its current commit
 * with `codeCommitId` (`null` when based on the initial code).
 */
class CodeCommits<T extends CodeType = CodeType> {
    readonly code: iCode<T>;
    readonly documents: LazyDocumentsOfType<'code_commit'>;
    @observable accessor isCommitting: boolean = false;

    constructor(code: iCode<T>) {
        this.code = code;
        this.documents = new LazyDocumentsOfType(code, 'code_commit');
    }

    get items() {
        return this.documents.items;
    }

    @action
    load() {
        if (!this.code.isCommitable) {
            return;
        }
        this.documents.load();
    }

    @action
    create(message: string) {
        const trimmedMessage = message.trim();
        if (!this.canCommit || !trimmedMessage || this.isCommitting) {
            return Promise.resolve(undefined);
        }
        this.isCommitting = true;
        return this.code.store
            .create({
                documentRootId: this.code.documentRootId,
                parentId: this.code.codeCommitId,
                type: 'code_commit',
                data: { code: this.code.code, message: trimmedMessage }
            })
            .then(
                action((commit) => {
                    this.isCommitting = false;
                    if (commit) {
                        this.code.setCodeCommitId(commit.id);
                    }
                    return commit;
                })
            );
    }

    // restore goes through `setCode`, so it is also recorded as a version.
    @action
    restore(commit: CodeCommit) {
        if (!this.code.canEdit) {
            return;
        }
        this.code.setCodeCommitId(commit.id);
        this.code.setCode(commit.code);
    }

    @action
    restoreInitial() {
        if (!this.code.canEdit) {
            return;
        }
        this.code.setCodeCommitId(null);
        this.code.setCode(this.code.meta.initCode);
    }

    @computed
    get graph(): CommitGraph<CommitGraphNode> {
        const commitIds = new Set(this.items.map((commit) => commit.id));
        const commitNodes = [...this.items].reverse().map((commit) => {
            // root commits and commits with an unknown parent are drawn on top of the initial code
            const parentId =
                commit.parentId && commitIds.has(commit.parentId) ? commit.parentId : INITIAL_CODE_ID;
            return { id: commit.id, parentId, commit };
        });
        const initialNode = { id: INITIAL_CODE_ID, parentId: null };
        return layoutCommitGraph([...commitNodes, initialNode]);
    }

    /**
     * @param nodeId a commit id or `INITIAL_CODE_ID`
     */
    codeOf(nodeId: string): string | undefined {
        if (nodeId === INITIAL_CODE_ID) {
            return this.code.meta.initCode;
        }
        return this.find(nodeId)?.code;
    }

    @computed
    get head(): CodeCommit | undefined {
        return this.find(this.code.codeCommitId);
    }

    @computed
    get hasUncommittedChanges() {
        const isHeadLoading = !!this.code.codeCommitId && !this.head;
        if (isHeadLoading) {
            return false;
        }
        const headCode = this.head?.code ?? this.code.meta.initCode;
        return this.code.code !== headCode;
    }

    @computed
    get canCommit() {
        return (
            this.code.isCommitable &&
            this.code.canEdit &&
            !this.code.root?.isDummy &&
            !this.code.store.root.userStore.isUserSwitched
        );
    }

    private find(id: string | null): CodeCommit | undefined {
        const document = this.code.store.find(id);
        return document?.type === 'code_commit' ? document : undefined;
    }
}

export default CodeCommits;
