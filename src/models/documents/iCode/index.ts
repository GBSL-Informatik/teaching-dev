import { action, computed, observable } from 'mobx';
import iDocument, { Source } from '@tdev-models/iDocument';
import { Document as DocumentProps, TypeDataMapping, ScriptVersionData, CodeType } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { orderBy } from 'es-toolkit/array';
import { throttle } from 'es-toolkit/function';
import iCodeMeta from './iCodeMeta';
import File from '../FileSystem/File';
import ScriptVersion from '../ScriptVersion';

type Props<T extends CodeType> = DocumentProps<T>;

interface Version {
    code: string;
    createdAt: Date;
    version: number;
    pasted?: boolean;
}

class iCode<T extends CodeType = CodeType> extends iDocument<T> {
    @observable accessor code: string;
    @observable accessor _initialVersionsLoaded: boolean = false;
    @observable accessor showRaw: boolean = false;
    @observable accessor isPasted: boolean = false;
    constructor(props: Props<T>, store: DocumentStore) {
        super(props, store);
        this.code = props.data?.code ?? this.meta.initCode;
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
    setCode(code: string, action?: 'insert' | 'remove' | string) {
        if (this.isPasted && action === 'remove') {
            return;
        }
        this.code = code;
        this.updatedAt = new Date();
        if (this.isVersioned) {
            this.addVersion({
                code: code,
                createdAt: this.updatedAt,
                version: this.versions.length + 1,
                pasted: this.isPasted
            });
        }
        if (this.isPasted) {
            this.isPasted = false;
        }

        /**
         * call the api to save the code...
         */
        this.save();
    }

    @action
    loadVersions(force: boolean = false) {
        if (this._initialVersionsLoaded && !force) {
            return;
        }
        if (!this.meta.hasHistory) {
            return;
        }
        this.store.root.documentRootStore.loadInNextBatch(this.documentRootId, this.meta, {
            documentType: 'script_version',
            skipCreate: true,
            documentRoot: false,
            groupPermissions: false,
            userPermissions: false
        });
        this._initialVersionsLoaded = true;
    }

    @computed
    get versionsLoaded() {
        return this._initialVersionsLoaded;
    }

    @computed
    get versions(): ScriptVersion[] {
        return orderBy(
            (this.root?.documents || []).filter(
                (doc) => doc.type === 'script_version' && doc.authorId === this.authorId
            ) as ScriptVersion[],
            ['createdAt'],
            ['asc']
        );
    }

    @action
    _addVersion(version: Version) {
        if (!this.isVersioned || this.store.root.userStore.isUserSwitched) {
            return;
        }
        if (!this.versionsLoaded) {
            this.loadVersions();
        }
        const versionData: ScriptVersionData = {
            code: version.code,
            pasted: version.pasted
        };
        this.store.create({
            documentRootId: this.documentRootId,
            data: versionData,
            type: 'script_version'
        });
    }

    addVersion = throttle(this._addVersion, 1000, {
        edges: ['trailing']
    });

    @action
    setData(data: Props<T>['data'], from: Source, updatedAt?: Date): void {
        if (from === Source.LOCAL) {
            this.setCode(data.code);
        } else {
            this.code = data.code;
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
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
        return `${this.preCode}\n${this.code}\n${this.postCode}`;
    }

    @computed
    get lang(): string {
        if (this.meta.lang === 'py') {
            return 'python';
        }
        return this.meta.lang.toLowerCase();
    }

    get canExecute(): boolean {
        return false;
    }

    get isExecuting(): boolean {
        return false;
    }

    @action
    runCode() {
        // NOOP
        // to be implemented by subclasses
    }

    @computed
    get derivedLang(): string {
        if (this.parent?.type === 'file') {
            const ext = (this.parent as File).name.split('.').pop();
            if (!ext || ext.toLowerCase() === 'py') {
                return 'python';
            }
            return ext.toLowerCase();
        }
        return this.meta.lang;
    }

    get data(): TypeDataMapping[T] {
        return {
            code: this.code
        } as TypeDataMapping[T];
    }

    @computed
    get meta(): iCodeMeta<T> {
        if (this.root?.type === this.type) {
            return this.root.meta as iCodeMeta<T>;
        }
        return new iCodeMeta({ code: '' }, this.type);
    }
}

export default iCode;
