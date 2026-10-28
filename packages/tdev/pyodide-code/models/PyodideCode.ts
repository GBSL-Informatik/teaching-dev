import { Document as DocumentProps, Factory } from '@tdev-api/document';
import iCode from '@tdev-models/documents/iCode';
import DocumentStore from '@tdev-stores/DocumentStore';
import type { ErrorMessage, LogMessage, Message } from '../messages';
import { orderBy } from 'es-toolkit/array';
import { action, computed, observable } from 'mobx';
import { ModelMeta } from './ModelMeta';

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
        return this.runtimeId !== null && this.pyodideStore.executions.get(this.id) === this.runtimeId;
    }

    @computed
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
        this.pyodideStore.sendInputResponse(this.id, this.promptResponse ?? '');
        this.promptResponse = null;
    }

    @action
    cancelPrompt() {
        this.stopExecution();
    }

    @action
    addLogMessage(message: Message) {
        this.messages.push({ ...message });
    }

    @action
    runCode(skipRemoteTrigger: boolean = false) {
        this.pyodideStore.run(this);
        if (this.isPresenting && this.canEdit && this.canExecute && !skipRemoteTrigger) {
            this.triggerRemoteAction({ action: 'runCode' });
        }
    }

    @action
    stopExecution(skipRemoteTrigger: boolean = false) {
        this.promptResponse = null;
        this.pyodideStore.stopExecution(this.id);
        this.setRuntimeId(null);
        if (this.isPresenting && this.canEdit && this.canExecute && !skipRemoteTrigger) {
            this.triggerRemoteAction({ action: 'stopExecution' });
        }
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
