import _ from 'lodash';

export type JsTypes = string | number | boolean | object | Function | bigint | Symbol | null | undefined;

export type GenericValue = JsString | JsNumber | JsBoolean | JsNullish;
export type JsValue = GenericValue | JsArray | JsObject | JsFunction;

interface JsString {
    type: 'string';
    name?: string;
    value: string;
}
interface JsNullish {
    type: 'nullish';
    name?: string;
    value: null | undefined;
}
export interface JsFunction {
    type: 'function';
    name?: string;
    value: Function;
}
interface JsNumber {
    type: 'number';
    name?: string;
    value: number;
}
interface JsBoolean {
    type: 'boolean';
    name?: string;
    value: boolean;
}
export interface JsObject {
    type: 'object';
    name?: string;
    value: JsValue[];
}
export interface JsArray {
    type: 'array';
    name?: string;
    value: JsValue[];
}

const transformValue = (value: JsTypes, key?: string): JsValue => {
    switch (typeof value) {
        case 'string':
            return { type: 'string', name: key, value } as JsString;
        case 'function':
            return { type: 'function', name: key, value } as JsFunction;
        case 'undefined':
            return { type: 'nullish', name: key, value: undefined } as JsNullish;
        case 'bigint':
        case 'number':
            return { type: 'number', name: key, value: Number(value) } as JsNumber;
        case 'boolean':
            return { type: 'boolean', name: key, value } as JsBoolean;
        case 'object':
            if (value === null) {
                return { type: 'nullish', name: key, value: null } as JsNullish;
            } else if (Array.isArray(value)) {
                return {
                    type: 'array',
                    name: key,
                    value: sortValues(value.map((item) => transformValue(item)))
                } as JsArray;
            } else {
                return {
                    type: 'object',
                    name: key,
                    value: sortValues(Object.entries(value).map(([key, value]) => transformValue(value, key)))
                } as JsObject;
            }
        default:
            throw new Error(`Unsupported response type for key ${key}`);
    }
};

const SortPrecedence: { [key: string]: number } = {
    function: 0,
    object: 1,
    array: 2
};

const sortValues = (values: JsValue[]): JsValue[] => {
    return _.orderBy(
        values,
        [(prop) => SortPrecedence[prop.type] ?? 3, (prop) => prop.name?.toLowerCase()],
        ['desc', 'asc']
    );
};

export const toJsSchema = (jsObject: Record<string, JsTypes> | JsTypes[]): JsValue[] => {
    if (Array.isArray(jsObject)) {
        return sortValues(jsObject.map((item) => transformValue(item)));
    } else {
        return sortValues(Object.entries(jsObject).map(([key, value]) => transformValue(value, key)));
    }
};
