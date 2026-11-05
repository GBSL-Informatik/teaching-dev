import type { CodeType } from '@tdev-api/document';
import type CodeCommit from '@tdev-models/documents/CodeCommit';
import type iCode from '@tdev-models/documents/iCode';
import { RootStore } from '@tdev-stores/rootStore';
import { action, observable } from 'mobx';

/**
 * UI state of the commit panels of `commitable` code blocks, keyed by the code document id.
 * A node id is a commit id or `INITIAL_CODE_ID`.
 */
export class CodeCommitsView {
    readonly root: RootStore;
    openPanels = observable.map<string, boolean>();
    selectedNodeIds = observable.map<string, string>();
    previewedNodeIds = observable.map<string, string>();

    constructor(root: RootStore) {
        this.root = root;
    }

    isPanelOpen<T extends CodeType>(code: iCode<T>) {
        return !!this.openPanels.get(code.id);
    }

    isSelected<T extends CodeType>(code: iCode<T>, nodeId: string) {
        return this.selectedNodeIds.get(code.id) === nodeId;
    }

    isPreviewed<T extends CodeType>(code: iCode<T>, nodeId: string) {
        return this.previewedNodeIds.get(code.id) === nodeId;
    }

    /**
     * The code of the previewed node, displayed read only in the editor.
     */
    previewCode<T extends CodeType>(code: iCode<T>): string | undefined {
        const nodeId = this.previewedNodeIds.get(code.id);
        return nodeId ? code.codeOf(nodeId) : undefined;
    }

    @action
    togglePanel<T extends CodeType>(code: iCode<T>) {
        if (this.isPanelOpen(code)) {
            this.openPanels.delete(code.id);
            this.clearSelection(code);
            return;
        }
        this.openPanels.set(code.id, true);
    }

    @action
    toggleSelection<T extends CodeType>(code: iCode<T>, nodeId: string) {
        if (this.isSelected(code, nodeId)) {
            this.selectedNodeIds.delete(code.id);
            return;
        }
        this.selectedNodeIds.set(code.id, nodeId);
    }

    @action
    togglePreview<T extends CodeType>(code: iCode<T>, nodeId: string) {
        if (this.isPreviewed(code, nodeId)) {
            this.previewedNodeIds.delete(code.id);
            return;
        }
        this.previewedNodeIds.set(code.id, nodeId);
    }

    /**
     * Restores the given commit, or the initial code when no commit is given.
     */
    @action
    restore<T extends CodeType>(code: iCode<T>, commit?: CodeCommit) {
        if (commit) {
            code.restoreCommit(commit);
        } else {
            code.restoreInitialCode();
        }
        this.clearSelection(code);
    }

    @action
    cleanup() {
        this.openPanels.clear();
        this.selectedNodeIds.clear();
        this.previewedNodeIds.clear();
    }

    @action
    private clearSelection<T extends CodeType>(code: iCode<T>) {
        this.selectedNodeIds.delete(code.id);
        this.previewedNodeIds.delete(code.id);
    }
}
