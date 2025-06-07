import { action, computed, observable } from 'mobx';
import { JsonSchema as JsonSchemaType } from '@tdev-api/admin';
import JsonObject from './JsonObject';
import JsonArray from './JsonArray';
import JsonNumber from './JsonNumber';
import JsonString from './JsonString';
import iJson from './iJson';
import { JsTypes } from '@tdev-components/shared/JsObject/toJsSchema';

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
        const schema: JsonSchemaType & Record<string, JsTypes> = {
            name: this.schema.name,
            schema: this.schema.serialized,
            strict: this.strict
        };
        if (this.description) {
            schema.description = this.description;
        }
        return schema;
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
