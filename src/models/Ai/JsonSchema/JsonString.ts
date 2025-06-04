import { action, computed } from 'mobx';
import iJson, { iJsonType } from './iJson';
import { JsonSchemaType, JsonString as SchemaJsonString } from '@tdev-api/admin';
import JsonArray from './JsonArray';
import JsonObject from './JsonObject';
import { toModel } from './helpers';

class JsonString extends iJson<SchemaJsonString> {
    readonly type = 'string';

    constructor(name: string, props: SchemaJsonString, parent: JsonArray | JsonObject) {
        super(name, props, parent);
    }

    @computed
    get serialized() {
        const json: SchemaJsonString = {
            type: this.type
        };
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
}

export default JsonString;
