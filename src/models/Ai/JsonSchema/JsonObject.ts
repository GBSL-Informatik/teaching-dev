import { action, computed, observable } from 'mobx';
import iJson, { iJsonType, iProps } from './iJson';
import {
    JsonObject as SchemaJsonObject,
    JsonNumber as SchemaJsonNumber,
    JsonArray as SchemaJsonArray,
    JsonString as SchemaJsonString,
    JsonSchemaType
} from '@tdev-api/admin';
import JsonString from './JsonString';
import JsonArray from './JsonArray';
import JsonNumber from './JsonNumber';
import _ from 'lodash';
import JsonSchema, { JsonType } from '.';
import { toModel } from './helpers';

class JsonObject extends iJson<SchemaJsonObject> {
    readonly type = 'object';
    @observable accessor additionalProperties: boolean;
    @observable accessor collapsed: boolean = false;
    _properties = observable.array<JsonType>([], { deep: false });

    constructor(name: string, props: SchemaJsonObject, parent: JsonArray | JsonObject | JsonSchema) {
        super(name, props, parent);
        this.additionalProperties = props.additionalProperties;
        this._properties.replace(
            Object.entries(props.properties || {}).map(([key, value]) => toModel(key, value, this))
        );
    }

    @computed
    get required(): string[] {
        return [...new Set(this._properties.map((prop) => prop.name))];
    }

    @computed
    get properties(): (JsonArray | JsonNumber | JsonString | JsonObject)[] {
        return _.orderBy(
            this._properties,
            [(prop) => (prop.type === 'object' ? 0 : 1), (prop) => prop.name.toLowerCase()],
            ['desc', 'asc']
        );
    }

    @action
    setCollapsed(value: boolean) {
        this.collapsed = value;
    }

    @action
    createProperty(type: iJsonType) {
        const name = `${this.properties.length + 1}`;
        const newProperty = toModel(name, { type, description: undefined } as JsonSchemaType, this);
        this._properties.push(newProperty);
        if (this.collapsed) {
            this.setCollapsed(false);
        }
        return newProperty;
    }

    @computed
    get serialized() {
        const json: SchemaJsonObject = {
            type: this.type,
            properties: Object.fromEntries<JsonSchemaType>(
                this.properties.map((prop) => [prop.name, prop.serialized as JsonSchemaType])
            ),
            additionalProperties: this.additionalProperties,
            required: this.required
        };
        if (this.description) {
            json.description = this.description;
        }
        return json;
    }

    @action
    remove(model?: iJson) {
        if (!model) {
            this.parent.remove(this);
        } else {
            this._properties.remove(model as JsonType);
        }
    }

    @action
    changeType(type: iJsonType): void {
        if (this.parent.type === 'schema') {
            return;
        }
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
    replaceProperty(old: iJson, newProperty: JsonType) {
        this._properties.remove(old as JsonType);
        this._properties.push(newProperty);
    }
}

export default JsonObject;
