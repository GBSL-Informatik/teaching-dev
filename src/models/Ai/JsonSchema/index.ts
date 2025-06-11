import { action, computed, observable } from 'mobx';
import JsonObject from './JsonObject';
import JsonArray from './JsonArray';
import JsonNumber from './JsonNumber';
import JsonString from './JsonString';
import iJson from './iJson';
import { JsTypes } from '@tdev-components/shared/JsObject/toJsSchema';

export interface JsonStringType {
    type: 'string';
    description?: string;
}

export interface JsonNumberType {
    type: 'number';
    description?: string;
    minimum?: number;
    maximum?: number;
}

export interface JsonArrayType {
    type: 'array';
    items: JsonSchemaValueType;
    description?: string;
    minItems?: number;
    maxItems?: number;
}

export interface JsonObjectType {
    type: 'object';
    required: Readonly<Array<keyof this['properties']>>;
    additionalProperties: boolean;
    description?: string;
    properties: {
        [key: string]: JsonSchemaValueType;
    };
}

export type JsonValueType = JsonStringType | JsonNumberType | JsonArrayType;
export type JsonSchemaValueType = JsonValueType | JsonObjectType;

export interface JsonSchemaType {
    name: string;
    schema: JsonObjectType;
    strict: boolean;
    description?: string;
}
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
    get serialized(): JsonSchemaType {
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
