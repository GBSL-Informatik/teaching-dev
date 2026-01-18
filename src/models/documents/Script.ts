import { action, computed, observable } from 'mobx';
import {
    CANVAS_OUTPUT_TESTER,
    DOM_ELEMENT_IDS,
    GRAPHICS_OUTPUT_TESTER,
    GRID_IMPORTS_TESTER,
    TURTLE_IMPORTS_TESTER
} from '@tdev-components/documents/CodeEditor/constants';
import { runCode } from '@tdev-components/documents/CodeEditor/utils/bryRunner';
import { Document as DocumentProps, TypeDataMapping } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import siteConfig from '@generated/docusaurus.config';
import globalData from '@generated/globalData';
import { default as iScriptMeta } from './iScript/ScriptMeta';
import { Props as CodeEditorProps } from '@tdev-components/documents/CodeEditor';
import _ from 'es-toolkit/compat';
import iScript from './iScript';
const libDir = (globalData['live-editor-theme'] as { default: { libDir: string } }).default.libDir;

export interface LogMessage {
    type: 'done' | 'stdout' | 'stderr' | 'start';
    output: string;
    timeStamp: number;
}

export class ScriptMeta extends iScriptMeta<'script'> {
    constructor(props: Partial<Omit<CodeEditorProps, 'id' | 'className'>>) {
        super(props, 'script');
    }
}

export default class Script extends iScript<'script'> {
    @observable accessor isExecuting: boolean = false;
    @observable accessor graphicsModalExecutionNr: number = 0;
    logs = observable.array<LogMessage>([], { deep: false });

    constructor(props: DocumentProps<'script'>, store: DocumentStore) {
        super(props, store);
    }

    @computed
    get meta(): ScriptMeta {
        if (this.root?.type === 'script') {
            return this.root.meta as ScriptMeta;
        }
        return new ScriptMeta({});
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

    @computed
    get _codeToExecute() {
        return this.combinedCode;
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
    toggleScriptExecution() {
        if (this.isExecuting) {
            this.stopScript();
        } else {
            this.execScript();
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

    get canExecute(): boolean {
        return true;
    }

    @action
    closeGraphicsModal() {
        this.graphicsModalExecutionNr = 0;
    }

    get source() {
        return 'browser';
    }
}
