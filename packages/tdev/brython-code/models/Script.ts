import { action, computed, observable } from 'mobx';
import { runCode } from '@tdev/brython-code/components/utils/bryRunner';
import { Document as DocumentProps, Factory, TypeDataMapping } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import siteConfig from '@generated/docusaurus.config';
import globalData from '@generated/globalData';
import _ from 'es-toolkit/compat';
import iCode from '@tdev-models/documents/iCode';
import { orderBy } from 'es-toolkit/array';
import {
    CANVAS_OUTPUT_TESTER,
    DOM_ELEMENT_IDS,
    GRAPHICS_OUTPUT_TESTER,
    GRID_IMPORTS_TESTER,
    TURTLE_IMPORTS_TESTER
} from '..';
import { ScriptMeta } from './ScriptMeta';
import { LogMessage as _LogMessageType } from '@tdev-components/documents/CodeEditor/Editor/Footer/Logs';
const libDir = (globalData['tdev-brython-code'] as { default: { libDir: string } }).default.libDir;
type LogMessageType = _LogMessageType & { timeStamp: number };

export interface LogMessage {
    type: 'done' | 'stdout' | 'stderr' | 'start';
    output: string;
    timeStamp: number;
}
export const createModel: Factory = (data, store) => {
    return new Script(data as DocumentProps<'script'>, store);
};

export default class Script extends iCode<'script'> {
    @observable accessor _isExecuting: boolean = false;
    @observable accessor graphicsModalExecutionNr: number = 0;
    messages = observable.array<LogMessage>([], { deep: false });

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
        this.messages.clear();
    }

    @computed
    get isExecuting(): boolean {
        return this._isExecuting;
    }

    @action
    setExecuting(isExecuting: boolean) {
        this._isExecuting = isExecuting;
    }

    @action
    addLogMessage(message: LogMessage) {
        this.messages.push({ output: message.output, timeStamp: Date.now(), type: message.type });
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
            this.runCode();
        }
    }

    @computed
    get logs(): LogMessageType[] {
        const logMessages = this.messages.filter((msg) => msg.type === 'stderr' || msg.type === 'stdout');
        const compactLogs = logMessages.reduce<LogMessageType[]>((acc, curr) => {
            const lastMsg = acc[acc.length - 1];
            const current = {
                type: curr.type === 'stderr' ? 'error' : 'log',
                message: curr.output,
                timeStamp: curr.timeStamp
            } satisfies LogMessageType;
            if (lastMsg && lastMsg.type === current.type) {
                if (lastMsg.message.endsWith('\n')) {
                    lastMsg.message = lastMsg.message.trimEnd();
                    acc.push(current);
                } else {
                    lastMsg.message += curr.output;
                }
            } else {
                acc.push(current);
            }
            return acc;
        }, [] satisfies LogMessageType[]);
        return orderBy(compactLogs, ['timeStamp'], ['asc']);
    }

    @action
    clearMessages() {
        this.messages.clear();
    }

    @action
    runCode() {
        if (this.hasGraphicsOutput) {
            if (this.hasTurtleOutput) {
                this.store.root.pageStore.setRunningTurtleScriptId(this.id);
            }
            this.graphicsModalExecutionNr = this.graphicsModalExecutionNr + 1;
        }
        this._isExecuting = true;
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
        return this.lang === 'python';
    }

    @action
    closeGraphicsModal() {
        this.graphicsModalExecutionNr = 0;
    }

    get source() {
        return 'browser';
    }
}
