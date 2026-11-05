import type { CodeType, ScriptVersionData } from '@tdev-api/document';
import { throttle } from 'es-toolkit/function';
import { action } from 'mobx';
import type iCode from '.';
import LazyDocumentsOfType from './LazyDocumentsOfType';

/**
 * Automatic snapshots (`script_version`) of a `versioned` code block, taken at most once per second.
 */
class CodeVersions<T extends CodeType = CodeType> {
    readonly code: iCode<T>;
    readonly documents: LazyDocumentsOfType<'script_version'>;

    constructor(code: iCode<T>) {
        this.code = code;
        this.documents = new LazyDocumentsOfType(code, 'script_version');
    }

    get isLoaded() {
        return this.documents.isLoaded;
    }

    get items() {
        return this.documents.items;
    }

    @action
    load(force: boolean = false) {
        if (!this.code.meta.hasHistory) {
            return;
        }
        this.documents.load(force);
    }

    @action
    onCodeChanged(code: string, pasted: boolean) {
        if (!this.code.isVersioned) {
            return;
        }
        this.addVersion(code, pasted);
    }

    private addVersion = throttle(this.createVersion, 1000, {
        edges: ['trailing']
    });

    @action
    private createVersion(code: string, pasted: boolean) {
        if (this.code.store.root.userStore.isUserSwitched) {
            return;
        }
        this.load();
        const versionData: ScriptVersionData = { code, pasted };
        this.code.store.create({
            documentRootId: this.code.documentRootId,
            data: versionData,
            type: 'script_version'
        });
    }
}

export default CodeVersions;
