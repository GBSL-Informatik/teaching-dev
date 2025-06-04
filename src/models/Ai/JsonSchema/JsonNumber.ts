import { action, computed, observable } from 'mobx';
import iJson, { iJsonType, iProps } from './iJson';
import {
    JsonObject as SchemaJsonObject,
    JsonNumber as SchemaJsonNumber,
    JsonArray as SchemaJsonArray,
    JsonString as SchemaJsonString,
    JsonSchemaType
} from '@tdev-api/admin';
import JsonArray from './JsonArray';
import JsonObject from './JsonObject';
import { toModel } from './helpers';

class JsonNumber extends iJson<SchemaJsonNumber> {
    readonly type = 'number';

    @observable accessor minimum: number | undefined;
    @observable accessor maximum: number | undefined;

    constructor(name: string, props: SchemaJsonNumber, parent: JsonArray | JsonObject) {
        super(name, props, parent);
    }

    @action
    setMinimum(minimum: number | undefined) {
        this.minimum = minimum;
    }
    @action
    setMaximum(maximum: number | undefined) {
        this.maximum = maximum;
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

    @computed
    get serialized() {
        const json: SchemaJsonNumber = {
            type: this.type
        };
        if (this.description) {
            json.description = this.description;
        }
        if (this.minimum !== undefined) {
            json.minimum = this.minimum;
        }
        if (this.maximum !== undefined) {
            json.maximum = this.maximum;
        }
        return json;
    }
}

export default JsonNumber;
