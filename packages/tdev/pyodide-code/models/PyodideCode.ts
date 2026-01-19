import { action, computed, observable } from 'mobx';
import { Source } from '@tdev-models/iDocument';
import { Document as DocumentProps, TypeDataMapping, Access, Factory } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { ModelMeta } from './ModelMeta';
import { Message, LogMessage, ErrorMessage } from '../config';
import iCode from '@tdev-models/documents/iCode';
import { orderBy } from 'es-toolkit/array';

export const createModel: Factory = (data, store) => {
    return new PyodideCode(data as DocumentProps<'pyodide_code'>, store);
};

class PyodideCode extends iCode<'pyodide_code'> {
    @observable accessor code: string;
    @observable accessor runtimeId: number | null = null;
    @observable accessor promptResponse: string | null = null;
    messages = observable.array<Message>([], { deep: false });
    constructor(props: DocumentProps<'pyodide_code'>, store: DocumentStore) {
        super(props, store);
        this.code = props.data?.code || this.meta.initCode || '';
    }

    @action
    clearMessages() {
        this.messages.clear();
    }

    @computed
    get logs(): (LogMessage | ErrorMessage)[] {
        return orderBy(
            this.messages.filter((msg) => msg.type === 'log' || msg.type === 'error'),
            ['timeStamp'],
            ['asc']
        );
    }

    @computed
    get logErrorIndices(): [number, number][] {
        const indices: [number, number][] = [];
        let currentIndex = 1;
        this.logs.forEach((msg, idx) => {
            const lineCount = msg.message.split('\n').length;
            if (msg.type === 'log') {
                currentIndex += lineCount;
                return;
            }
            indices.push([currentIndex, currentIndex + lineCount - 1]);
            currentIndex += lineCount;
        });
        return indices;
    }

    @action
    setRuntimeId(rid: number | null) {
        this.runtimeId = rid;
    }

    get canExecute(): boolean {
        return true;
    }

    @computed
    get isExecuting(): boolean {
        return this.runtimeId === this.pyodideStore.runtimeId;
    }

    get pyodideStore() {
        return this.store.root.viewStore.useStore('pyodideStore');
    }

    @computed
    get hasPrompt(): boolean {
        return this.pyodideStore.awaitingInputPrompt.has(this.id);
    }

    get promptText(): string | null {
        return this.pyodideStore.awaitingInputPrompt.get(this.id) || null;
    }

    @action
    setPromptResponse(response: string) {
        this.promptResponse = response;
    }

    @action
    sendPromptResponse() {
        if (this.promptResponse === null) {
            this.pyodideStore.cancelCodeExecution(this.id);
        }
        this.pyodideStore.sendInputResponse(this.id, this.promptResponse || '');
        this.promptResponse = null;
    }

    @action
    addLogMessage(message: Message) {
        this.messages.push({ ...message });
    }

    @action
    setData(data: TypeDataMapping['pyodide_code'], from: Source, updatedAt?: Date): void {
        this.code = data.code;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    @action
    runCode() {
        this.pyodideStore.run(this);
    }

    get data(): TypeDataMapping['pyodide_code'] {
        return {
            code: this.code
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'pyodide_code') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default PyodideCode;
