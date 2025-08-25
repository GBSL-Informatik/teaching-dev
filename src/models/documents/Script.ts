import { action, computed, observable, reaction } from 'mobx';
import throttle from 'lodash/throttle';
import {
    CANVAS_OUTPUT_TESTER,
    DOM_ELEMENT_IDS,
    GRAPHICS_OUTPUT_TESTER,
    GRID_IMPORTS_TESTER,
    TURTLE_IMPORTS_TESTER
} from '@tdev-components/documents/CodeEditor/constants';
import { runCode } from '@tdev-components/documents/CodeEditor/utils/bryRunner';
import iDocument, { Source } from '@tdev-models/iDocument';
import {
    DocumentType,
    Document as DocumentProps,
    ScriptVersionData,
    Access,
    TypeDataMapping
} from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import siteConfig from '@generated/docusaurus.config';
import globalData from '@generated/globalData';
import ScriptVersion from './ScriptVersion';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { Props as CodeEditorProps } from '@tdev-components/documents/CodeEditor';
import _ from 'lodash';
const libDir = (globalData['live-editor-theme'] as { default: { libDir: string } }).default.libDir;

export interface LogMessage {
    type: 'done' | 'stdout' | 'stderr' | 'start';
    output: string;
    timeStamp: number;
}

interface Version {
    code: string;
    createdAt: Date;
    version: number;
    pasted?: boolean;
}

export class ScriptMeta extends TypeMeta<DocumentType.Script> {
    readonly type = DocumentType.Script;
    readonly title: string;
    readonly lang: 'py' | string;
    readonly preCode: string;
    readonly postCode: string;
    readonly readonly: boolean;
    readonly versioned: boolean;
    readonly initCode: string;
    readonly slim: boolean;
    readonly hasHistory: boolean;
    readonly showLineNumbers: boolean;
    readonly maxLines: number;
    readonly isResettable: boolean;
    readonly canCompare: boolean;
    readonly canDownload: boolean;
    readonly hideWarning: boolean;
    readonly theme?: string;

    constructor(props: Partial<Omit<CodeEditorProps, 'id' | 'className'>>) {
        super(DocumentType.Script, props.readonly ? Access.RO_User : undefined);
        this.title = props.title || '';
        this.lang = props.lang || 'py';
        this.preCode = props.preCode || '';
        this.postCode = props.postCode || '';
        this.readonly = !!props.readonly;
        this.versioned = !!props.versioned;
        this.initCode = props.code || '';
        this.slim = !!props.slim;
        this.hasHistory = !!props.versioned && !props.noHistory;
        this.showLineNumbers = props.showLineNumbers === undefined ? true : props.showLineNumbers;
        this.maxLines = props.maxLines || 25;
        this.isResettable = !props.noReset;
        this.canCompare = !props.noCompare;
        this.canDownload = !props.noDownload;
        this.hideWarning = !!props.hideWarning;
        this.theme = props.theme;
    }

    get defaultData(): TypeDataMapping[DocumentType.Script] {
        return {
            code: this.initCode
        };
    }
}

export default class Script extends iDocument<DocumentType.Script> {
    @observable accessor code: string;
    @observable accessor isExecuting: boolean = false;
    @observable accessor showRaw: boolean = false;
    @observable accessor graphicsModalExecutionNr: number = 0;
    @observable accessor isPasted: boolean = false;
    logs = observable.array<LogMessage>([], { deep: false });

    constructor(props: DocumentProps<DocumentType.Script>, store: DocumentStore) {
        super(props, store);
        this.code = props.data?.code ?? this.meta.initCode;
    }

    @computed
    get meta(): ScriptMeta {
        if (this.root?.type === DocumentType.Script) {
            return this.root.meta as ScriptMeta;
        }
        return new ScriptMeta({});
    }

    get isLoaded() {
        return this.isInitialized;
    }

    @computed
    get title(): string {
        if (this.parent && this.parent.type === DocumentType.File) {
            return this.parent.name;
        }
        return this.meta.title;
    }

    @action
    clearLogMessages() {
        this.logs.clear();
    }

    @action
    setExecuting(isExecuting: boolean) {
        this.isExecuting = isExecuting;
    }

    @action
    addLogMessage(message: LogMessage) {
        this.logs.push({ output: message.output, timeStamp: Date.now(), type: message.type });
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
    loadVersions() {
        // nop
    }

    @computed
    get versions(): ScriptVersion[] {
        return _.orderBy(
            (this.root?.documents || []).filter(
                (doc) => doc.type === DocumentType.ScriptVersion && doc.authorId === this.authorId
            ) as ScriptVersion[],
            ['version'],
            ['asc']
        );
    }

    @action
    _addVersion(version: Version) {
        if (!this.isVersioned || this.store.root.userStore.isUserSwitched) {
            return;
        }
        const versionData: ScriptVersionData = {
            code: version.code,
            version: version.version,
            pasted: version.pasted
        };
        this.store.create({
            documentRootId: this.documentRootId,
            data: versionData,
            type: DocumentType.ScriptVersion
        });
    }

    addVersion = throttle(this._addVersion, 1000, {
        leading: false,
        trailing: true
    });

    @computed
    get _codeToExecute() {
        return `${this.preCode}\n${this.code}\n${this.postCode}`;
    }

    @computed
    get codeLines() {
        return this.code.split('\n').length;
    }

    @computed
    get data(): TypeDataMapping[DocumentType.Script] {
        return {
            code: this.code
        };
    }

    @action
    setData(data: TypeDataMapping[DocumentType.Script], from: Source, updatedAt?: Date) {
        if (from === Source.LOCAL) {
            this.setCode(data.code);
        } else {
            this.code = data.code;
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @action
    execScript() {
        if (this.hasGraphicsOutput) {
            if (this.hasTurtleOutput) {
                this.store.root.pageStore.setRunningTurtleScriptId(this.id);
            }
            this.graphicsModalExecutionNr = this.graphicsModalExecutionNr + 1;
        }
        this.isExecuting = true;
        runCode(
            this.code,
            this.preCode,
            this.postCode,
            this.codeId,
            libDir,
            siteConfig.future.experimental_router
        );
    }

    /**
     * stop the script from running
     * wheter the script is running or not is derived from the
     * `data--start-time` attribute on the communicator element.
     * This is used in combination with the game loop
     */
    @action
    stopScript() {
        const code = document?.getElementById(DOM_ELEMENT_IDS.communicator(this.codeId));
        if (code) {
            code.removeAttribute('data--start-time');
        }
    }

    @computed
    get hasGraphicsOutput() {
        return (
            this.hasTurtleOutput || this.hasCanvasOutput || GRAPHICS_OUTPUT_TESTER.test(this._codeToExecute)
        );
    }

    @computed
    get hasTurtleOutput() {
        return TURTLE_IMPORTS_TESTER.test(this._codeToExecute);
    }

    @computed
    get hasCanvasOutput() {
        return (
            CANVAS_OUTPUT_TESTER.test(this._codeToExecute) || GRID_IMPORTS_TESTER.test(this._codeToExecute)
        );
    }

    @computed
    get hasEdits() {
        return this.code !== this.pristineCode;
    }

    @computed
    get versionsLoaded() {
        return true;
    }

    @action
    closeGraphicsModal() {
        this.graphicsModalExecutionNr = 0;
    }

    subscribe(listener: () => void, selector: keyof Script) {
        if (Array.isArray(this[selector])) {
            return reaction(() => (this[selector] as Array<any>).length, listener);
        }
        return reaction(() => this[selector], listener);
    }

    @computed
    get pristineCode() {
        return this._pristineCode;
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

    @computed
    get codeId() {
        return `code.${this.meta.title || this.meta.lang}.${this.id}`.replace(/(-|\.)/g, '_');
    }
    get source() {
        return 'browser';
    }
    get preCode() {
        return this.meta.preCode;
    }
    get postCode() {
        return this.meta.postCode;
    }

    get lang() {
        if (this.meta.lang === 'py') {
            return 'python';
        }
        return this.meta.lang;
    }
}
