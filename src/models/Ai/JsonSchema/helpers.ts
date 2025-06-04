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
import { JsonType } from '.';
import JsonObject from './JsonObject';

export const toModel = (
    name: string,
    value: Partial<JsonSchemaType>,
    parent: JsonArray | JsonObject
): JsonType => {
    switch (value.type) {
        case 'string':
            return new JsonString(name, value as SchemaJsonString, parent);
        case 'number':
            return new JsonNumber(name, value as SchemaJsonNumber, parent);
        case 'array':
            return new JsonArray(name, { items: { type: 'string' }, ...value } as SchemaJsonArray, parent);
        case 'object':
            return new JsonObject(
                name,
                {
                    additionalProperties: false,
                    properties: {},
                    required: [],
                    ...value
                } as SchemaJsonObject,
                parent
            );
        default:
            throw new Error(`Unsupported JSON schema type: ${(value as any).type}`);
    }
};
