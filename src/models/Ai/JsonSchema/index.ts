import { action, computed, observable } from 'mobx';
import { JsonSchema as JsonSchemaType } from '@tdev-api/admin';
import JsonObject from './JsonObject';
import JsonArray from './JsonArray';
import JsonNumber from './JsonNumber';
import JsonString from './JsonString';
import iJson, { iJsonType } from './iJson';

export type JsonType = JsonObject | JsonString | JsonNumber | JsonArray;
export type ParentType = JsonObject | JsonArray | JsonSchema;

class JsonSchema {
    readonly type = 'schema';
    @observable.ref accessor schema: JsonObject;
    @observable accessor description: string | undefined;
    @observable accessor strict: boolean;

    constructor(props: JsonSchemaType) {
        this.description = props.description;
        this.strict = props.strict ?? false;
        this.schema = new JsonObject(props.name, props.schema, this);
    }

    @computed
    get serialized() {
        return {
            name: this.schema.name,
            description: this.description,
            strict: this.strict,
            schema: this.schema.serialized
        };
    }

    @action
    remove(model?: iJson) {
        // do nothing
    }

    @action
    replaceProperty(old: iJson, newProperty: JsonType): void {
        // do nothing
    }
}

export default JsonSchema;
