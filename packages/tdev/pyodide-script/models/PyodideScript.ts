import { action, computed, observable } from 'mobx';
import { Source } from '@tdev-models/iDocument';
import { Document as DocumentProps, TypeDataMapping, Access, Factory } from '@tdev-api/document';
import DocumentStore from '@tdev-stores/DocumentStore';
import { ModelMeta } from './ModelMeta';
import { Message } from '../config';
import iScript from '@tdev-models/documents/iScript';

export const createModel: Factory = (data, store) => {
    return new PyodideScript(data as DocumentProps<'pyodide_script'>, store);
};

class PyodideScript extends iScript<'pyodide_script'> {
    @observable accessor code: string;
    @observable accessor runtimeId: number | null = null;
    @observable accessor promptResponse: string | null = null;
    logs = observable.array<Message>([], { deep: false });
    constructor(props: DocumentProps<'pyodide_script'>, store: DocumentStore) {
        super(props, store);
        this.code = props.data?.code || this.meta.initCode || '';
    }
    @action
    clearLogMessages() {
        this.logs.clear();
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
        this.logs.push({ ...message });
    }

    @action
    setData(data: TypeDataMapping['pyodide_script'], from: Source, updatedAt?: Date): void {
        this.code = data.code;
        if (from === Source.LOCAL) {
            this.save();
        }
        if (updatedAt) {
            this.updatedAt = new Date(updatedAt);
        }
    }

    get data(): TypeDataMapping['pyodide_script'] {
        return {
            code: this.code
        };
    }

    @computed
    get meta(): ModelMeta {
        if (this.root?.type === 'pyodide_script') {
            return this.root.meta as ModelMeta;
        }
        return new ModelMeta({});
    }
}

export default PyodideScript;
