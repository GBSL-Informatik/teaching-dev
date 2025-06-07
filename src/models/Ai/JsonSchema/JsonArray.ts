import { action, computed, observable } from 'mobx';
import iJson, { iJsonType } from './iJson';
import { JsonSchemaType, JsonArray as SchemaJsonArray } from '@tdev-api/admin';
import type JsonObject from './JsonObject';
import { JsonType } from '.';
import { toModel } from './helpers';

class JsonArray extends iJson<SchemaJsonArray> {
    readonly type = 'array';
    @observable accessor maxItems: number | undefined;
    @observable accessor minItems: number | undefined;
    @observable accessor items: JsonType;

    constructor(name: string, data: SchemaJsonArray, parent: JsonArray | JsonObject) {
        super(name, data, parent);
        this.items = toModel(name, data.items, this);
    }

    @action
    setMaxItems(maxItems: number | undefined) {
        this.maxItems = maxItems;
    }
    @action
    setMinItems(minItems: number | undefined) {
        this.minItems = minItems;
    }

    @computed
    get serialized(): SchemaJsonArray {
        const json: SchemaJsonArray = {
            type: this.type,
            items: this.items.serialized
        };
        if (this.maxItems !== undefined) {
            json.maxItems = this.maxItems;
        }
        if (this.minItems !== undefined) {
            json.minItems = this.minItems;
        }
        if (this.description) {
            json.description = this.description;
        }
        return json;
    }

    @action
    changeType(type: iJsonType): void {
        this.parent.replaceProperty(
            this,
            toModel(
                this.name,
                { type, description: this.description } as JsonSchemaType,
                this.parent as JsonArray | JsonObject
            )
        );
    }

    @action
    replaceProperty(old: any, newProperty: JsonType) {
        this.items = newProperty;
    }
}

export default JsonArray;
