import { action, observable } from 'mobx';
// import JsonArray from './JsonArray';
import { type ParentType } from '.';
import { toModel } from './helpers';

export interface iProps {
    description?: string;
}

export type iJsonType = 'string' | 'number' | 'array' | 'object';

abstract class iJson<T extends iProps = iProps> {
    readonly parent: ParentType;
    abstract readonly type: iJsonType;
    @observable accessor name: string;
    @observable accessor description: string | undefined;

    constructor(name: string, props: iProps, parent: ParentType) {
        this.name = name;
        this.description = props.description;
        this.parent = parent;
    }

    @action
    setName(name: string) {
        this.name = name;
    }

    @action
    setDescription(description: string | undefined) {
        this.description = description;
    }

    @action
    remove(model?: iJson) {
        if (!model) {
            this.parent.remove(this);
        }
    }

    abstract changeType(type: iJsonType): void;

    abstract get serialized(): T;
}

export default iJson;
