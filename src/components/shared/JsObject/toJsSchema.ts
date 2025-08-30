import _ from 'es-toolkit/compat';

export type JsTypes = string | number | boolean | object | Function | bigint | Symbol | null | undefined;

export type GenericValue = JsString | JsNumber | JsBoolean | JsNullish;
export type JsParents = JsArray | JsObject | JsRoot;
export type JsValue = GenericValue | JsParents | JsFunction;
export type JsTypeName = JsValue['type'];

export type EditLevel = 'all' | 'value' | 'name' | 'none';
interface JsValueBase {
    editLevel?: EditLevel;
}

export interface JsString extends JsValueBase {
    type: 'string';
    value: string;
    name?: string;
}
export interface JsNullish extends JsValueBase {
    type: 'nullish';
    value: null | undefined;
    name?: string;
}
export interface JsFunction extends JsValueBase {
    type: 'function';
    value: Function;
    name?: string;
}
export interface JsNumber extends JsValueBase {
    type: 'number';
    value: number;
    name?: string;
}
export interface JsBoolean extends JsValueBase {
    type: 'boolean';
    value: boolean;
    name?: string;
}
export interface JsObject extends JsValueBase {
    type: 'object';
    value: JsValue[];
    name?: string;
}
export interface JsArray extends JsValueBase {
    type: 'array';
    value: JsValue[];
    name?: string;
}
export interface JsRoot extends JsValueBase {
    type: 'root';
    value: JsValue[];
    name?: string;
}

const sanitizedName = (value: JsValue): JsValue => {
    if (value.name === undefined) {
        delete value.name;
    }
    return value;
};
const transformValue = (value: JsTypes, key?: string): JsValue => {
    switch (typeof value) {
        case 'string':
            return sanitizedName({ type: 'string', value, name: key }) as JsString;
        case 'function':
            return sanitizedName({ type: 'function', value, name: key }) as JsFunction;
        case 'undefined':
            return sanitizedName({ type: 'nullish', value: undefined, name: key }) as JsNullish;
        case 'bigint':
        case 'number':
            return sanitizedName({ type: 'number', value: Number(value), name: key }) as JsNumber;
        case 'boolean':
            return sanitizedName({ type: 'boolean', value, name: key }) as JsBoolean;
        case 'object':
            if (value === null) {
                return sanitizedName({ type: 'nullish', value: null, name: key }) as JsNullish;
            } else if (Array.isArray(value)) {
                return sanitizedName({
                    type: 'array',
                    value: value.map((item) => transformValue(item)),
                    name: key
                }) as JsArray;
            } else {
                return sanitizedName({
                    type: 'object',
                    value: sortValues(
                        Object.entries(value).map(([key, value]) => transformValue(value, key))
                    ),
                    name: key
                }) as JsObject;
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

type SortableType = { type: string; name?: string; pristineName?: string };

export const sortValues = <T extends SortableType>(values: T[], by: keyof SortableType = 'name'): T[] => {
    return _.orderBy(
        values,
        [(prop) => SortPrecedence[prop.type] ?? 3, (prop) => prop[by]?.toLowerCase()],
        ['desc', 'asc']
    );
};

export const toJsSchema = (jsObject: Record<string, JsTypes> | JsTypes[]): JsValue[] => {
    if (Array.isArray(jsObject)) {
        return jsObject.map((item) => transformValue(item));
    } else {
        return sortValues(Object.entries(jsObject).map(([key, value]) => transformValue(value, key)));
    }
};
