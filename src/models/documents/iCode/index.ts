import { CodeType, Document as DocumentProps, TypeDataMapping } from '@tdev-api/document';
import iDocument, { Source } from '@tdev-models/iDocument';
import DocumentStore from '@tdev-stores/DocumentStore';
import { action, computed, observable } from 'mobx';
import CodeCommits from './CodeCommits';
import CodeVersions from './CodeVersions';
import iCodeMeta from './iCodeMeta';

type Props<T extends CodeType> = DocumentProps<T>;

export interface CodePostUpdateMeta extends Record<string, unknown> {
    action?: 'runCode' | 'stopExecution';
}

class iCode<T extends CodeType = CodeType> extends iDocument<T> {
    @observable accessor code: string;
    @observable accessor showRaw: boolean = false;
    @observable accessor isPasted: boolean = false;
    @observable accessor codeCommitId: string | null;
    readonly versions: CodeVersions<T>;
    readonly commits: CodeCommits<T>;

    constructor(props: Props<T>, store: DocumentStore) {
        super(props, store);
        this.code = props.data?.code ?? this.meta.initCode;
        this.codeCommitId = props.data?.codeCommitId ?? null;
        this.versions = new CodeVersions(this);
        this.commits = new CodeCommits(this);
    }

    @computed
    get title(): string {
        if (this.parent && this.parent.type === 'file') {
            return this.parent.name;
        }
        return this.meta.title || '';
    }

    @computed
    get codeId() {
        return `code.${this.meta.title || this.meta.lang}.${this.id}`.replace(/(-|\.)/g, '_');
    }

    @action
    setCode(code: string, action?: 'insert' | 'remove' | string, isComposing: boolean = false) {
        if (this.isPasted && action === 'remove') {
            return;
        }
        this.code = code;
        this.updatedAt = new Date();
        this.versions.onCodeChanged(code, this.isPasted);
        if (this.isPasted) {
            this.isPasted = false;
        }

        /**
         * call the api to save the code...
         */
        this.save(action === 'remove' && isComposing);
    }

    @action
    setCodeCommitId(codeCommitId: string | null) {
        this.codeCommitId = codeCommitId;
        this.save();
    }

    @action
    setData(data: Props<T>['data'], from: Source, updatedAt?: Date): void {
        if ('codeCommitId' in data) {
            this.codeCommitId = data.codeCommitId ?? null;
        }
        if ('code' in data) {
            if (from === Source.LOCAL) {
                this.setCode(data.code);
            } else {
                this.code = data.code;
            }
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @action
    postUpdate(meta?: CodePostUpdateMeta) {
        if (!meta || this.presentingGroups.some((g) => !g.isRemoteExecutionAllowed)) {
            return;
        }
        switch (meta.action) {
            case 'runCode':
                this.runCode(true);
                break;
            case 'stopExecution':
                this.stopExecution(true);
                break;
        }
    }

    @action
    triggerRemoteAction(action: CodePostUpdateMeta) {
        if (!action.action) {
            return;
        }
        const group = this.store.root.studentGroupStore.presentingStudentGroups.find(
            (g) => g.presentedDocument?.id === this.id
        );
        if (!this.isPresenting || !this.canEdit || !this.canExecute || !group || !group.presentedDocument) {
            return;
        }
        if (this.presentingGroups.some((g) => !g.isRemoteExecutionAllowed)) {
            return;
        }
        this.store.root.socketStore.streamUpdate(group.id, { id: this.id, data: this.data }, action);
    }

    @computed
    get codeLines() {
        return this.code.split('\n').length;
    }

    @computed
    get pristineCode() {
        return this._pristineCode;
    }

    @computed
    get hasEdits() {
        return this.code !== this.pristineCode;
    }

    @action
    setIsPasted(isPasted: boolean) {
        this.isPasted = isPasted;
    }

    @action
    setShowRaw(showRaw: boolean) {
        this.showRaw = showRaw;
    }

    get isVersioned() {
        return this.meta.versioned;
    }

    get isCommitable() {
        return this.meta.commitable;
    }

    get _pristineCode() {
        return this.meta.initCode;
    }

    get preCode() {
        return this.meta.preCode;
    }

    get postCode() {
        return this.meta.postCode;
    }

    @computed
    get combinedCode() {
        return `${this.preCode}\n${this.code}\n${this.postCode}`.trim();
    }

    @computed
    get lang(): string {
        if (this.parent?.type === 'file') {
            const ext = this.parent.fileExtension;
            if (ext === 'py') {
                return 'python';
            }
        }
        if (this.meta.lang === 'py') {
            return 'python';
        }
        return this.meta.lang.toLowerCase();
    }

    @computed
    get derivedLang(): string {
        if (this.parent?.type === 'file') {
            const ext = this.parent.fileExtension;
            if (!ext || ext === 'py') {
                return 'python';
            }
            return ext.toLowerCase();
        }
        return this.lang;
    }

    get canExecute(): boolean {
        return false;
    }

    @computed
    get isExecuting(): boolean {
        return false;
    }

    @action
    runCode(skipRemoteTrigger: boolean = false) {
        // NOOP
        // to be implemented by subclasses
    }

    @action
    stopExecution(skipRemoteTrigger: boolean = false) {
        // NOOP
        // to be implemented by subclasses
    }

    get data(): TypeDataMapping[T] {
        const data: TypeDataMapping[T] = {
            code: this.code
        };
        if (this.isCommitable) {
            data.codeCommitId = this.codeCommitId;
        }
        return data;
    }

    @computed
    get meta(): iCodeMeta<T> {
        if (this.root?.type === this.type) {
            return this.root.meta as iCodeMeta<T>;
        }
        return new iCodeMeta(this.type, { code: '' });
    }
}

export default iCode;
