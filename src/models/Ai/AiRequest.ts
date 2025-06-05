import { AiRequest as AiRequestProps, Response } from '@tdev-api/aiRequest';
import { AiStore } from '@tdev-stores/AiStore';
import { computed } from 'mobx';

interface StringResponse {
    type: 'string';
    name: string;
    value: string;
}
interface NumberResponse {
    type: 'number';
    name: string;
    value: number;
}
interface BooleanResponse {
    type: 'boolean';
    name: string;
    value: boolean;
}
type ItemType = 'string' | 'number' | 'boolean' | 'object' | 'array';
export interface ArrayResponse {
    type: 'array';
    name: string;
    items: ItemType;
    value: number[] | string[] | boolean[] | ObjectResponse[] | ArrayResponse[];
}

export type GenericValue = StringResponse | NumberResponse | BooleanResponse;
export type ObjectValue = GenericValue | ArrayResponse | ObjectResponse;

export interface ObjectResponse {
    type: 'object';
    name: string;
    value: ObjectValue[];
}

class AiRequest {
    readonly store: AiStore;
    readonly id: string;
    readonly userId: string;
    readonly aiTemplateId: string;
    readonly status: 'pending' | 'completed' | 'failed';
    readonly statusCode?: number;
    readonly request: string;
    readonly _response: Response | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(data: AiRequestProps, store: AiStore) {
        this.store = store;
        this.id = data.id;
        this.userId = data.userId;
        this.aiTemplateId = data.aiTemplateId;
        this.status = data.status;
        this.statusCode = data.statusCode;
        this.request = data.request;
        this._response = data.response;
        this.createdAt = new Date(data.createdAt);
        this.updatedAt = new Date(data.updatedAt);
    }

    @computed
    get user() {
        return this.store.root.userStore.findById(this.userId);
    }

    @computed
    get response(): ObjectResponse | null {
        if (!this._response) {
            return null;
        }
        const convertResponse = (response: Response): ObjectValue[] => {
            const res = Object.entries(response).map(([key, value]) => {
                if (typeof value === 'string') {
                    return { type: 'string', name: key, value } as StringResponse;
                } else if (typeof value === 'number') {
                    return { type: 'number', name: key, value } as NumberResponse;
                } else if (typeof value === 'boolean') {
                    return { type: 'boolean', name: key, value } as BooleanResponse;
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        return {
                            type: 'array',
                            name: key,
                            items: 'string',
                            value: []
                        } as ArrayResponse;
                    }
                    const firstItem = value[0];
                    return {
                        type: 'array',
                        name: key,
                        items: typeof firstItem as ItemType,
                        value: Array.isArray(firstItem)
                            ? convertResponse(
                                  value.reduce((acc, item, idx) => {
                                      acc[`${key}#${idx}`] = item;
                                      return acc;
                                  }, {} as Response)
                              )
                            : typeof firstItem === 'object'
                              ? convertResponse(firstItem as Response)
                              : (value as unknown as string[] | number[] | boolean[])
                    } as ArrayResponse;
                } else if (typeof value === 'object' && value !== null) {
                    return {
                        type: 'object',
                        name: key,
                        value: convertResponse(value as Response)
                    } as ObjectResponse;
                }
                throw new Error(`Unsupported response type for key ${key}`);
            });
            return res;
        };
        return {
            type: 'object',
            name: 'response',
            value: convertResponse(this._response)
        };
    }
}

export default AiRequest;
