import { action, computed, observable, reaction } from 'mobx';
import { throttle } from 'es-toolkit/compat';
import {
    CANVAS_OUTPUT_TESTER,
    DOM_ELEMENT_IDS,
    GRAPHICS_OUTPUT_TESTER,
    GRID_IMPORTS_TESTER,
    TURTLE_IMPORTS_TESTER
} from '@tdev-components/documents/CodeEditor/constants';
import { runCode } from '@tdev-components/documents/CodeEditor/utils/bryRunner';
import iDocument, { Source } from '@tdev-models/iDocument';
import { Document as DocumentProps, ScriptVersionData, Access, TypeDataMapping } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import siteConfig from '@generated/docusaurus.config';
import globalData from '@generated/globalData';
import ScriptVersion from './ScriptVersion';
import { TypeMeta } from '@tdev-models/DocumentRoot';
import { Props as CodeEditorProps } from '@tdev-components/documents/CodeEditor';
import _ from 'es-toolkit/compat';
import File from './FileSystem/File';
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

export class ScriptMeta extends TypeMeta<'script'> {
    readonly type = 'script';
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
    readonly minLines?: number;
    readonly maxLines: number;
    readonly isResettable: boolean;
    readonly canCompare: boolean;
    readonly canDownload: boolean;
    readonly hideWarning: boolean;
    readonly theme?: string;

    constructor(props: Partial<Omit<CodeEditorProps, 'id' | 'className'>>) {
        super('script', props.readonly ? Access.RO_User : undefined);
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
        this.minLines = props.minLines;
        this.isResettable = !props.noReset;
        this.canCompare = !props.noCompare;
        this.canDownload = !props.noDownload;
        this.hideWarning = !!props.hideWarning;
        this.theme = props.theme;
    }

    get defaultData(): TypeDataMapping['script'] {
        return {
            code: this.initCode
        };
    }
}

export default class Script extends iDocument<'script'> {
    @observable accessor code: string;
    @observable accessor isExecuting: boolean = false;
    @observable accessor showRaw: boolean = false;
    @observable accessor graphicsModalExecutionNr: number = 0;
    @observable accessor isPasted: boolean = false;
    @observable accessor _initialVersionsLoaded: boolean = false;
    logs = observable.array<LogMessage>([], { deep: false });

    constructor(props: DocumentProps<'script'>, store: DocumentStore) {
        super(props, store);
        this.code = props.data?.code ?? this.meta.initCode;
    }

    @computed
    get meta(): ScriptMeta {
        if (this.root?.type === 'script') {
            return this.root.meta as ScriptMeta;
        }
        return new ScriptMeta({});
    }

    get isLoaded() {
        return this.isInitialized;
    }

    @computed
    get title(): string {
        if (this.parent && this.parent.type === 'file') {
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
    get versions(): ScriptVersion[] {
        return _.orderBy(
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
    get data(): TypeDataMapping['script'] {
        return {
            code: this.code
        };
    }

    @action
    setData(data: TypeDataMapping['script'], from: Source, updatedAt?: Date) {
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
        return this._initialVersionsLoaded;
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

    @computed
    get lang(): string {
        if (this.meta.lang === 'py') {
            return 'python';
        }
        return this.meta.lang.toLowerCase();
    }
}
