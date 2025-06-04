import { AiRequest as AiRequestProps } from '@tdev-api/aiRequest';
import { AiStore } from '@tdev-stores/AiStore';
import { computed } from 'mobx';

class AiRequest<T = any> {
    readonly store: AiStore;
    readonly id: string;
    readonly userId: string;
    readonly aiTemplateId: string;
    readonly status: 'pending' | 'completed' | 'failed';
    readonly statusCode?: number;
    readonly request: string;
    readonly response: T;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(data: AiRequestProps<T>, store: AiStore) {
        this.store = store;
        this.id = data.id;
        this.userId = data.userId;
        this.aiTemplateId = data.aiTemplateId;
        this.status = data.status;
        this.statusCode = data.statusCode;
        this.request = data.request;
        this.response = data.response;
        this.createdAt = new Date(data.createdAt);
        this.updatedAt = new Date(data.updatedAt);
    }

    @computed
    get user() {
        return this.store.root.userStore.findById(this.userId);
    }
}

export default AiRequest;
