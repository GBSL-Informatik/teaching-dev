import JsArray from './JsArray';
import JsNumber from './JsNumber';
import _ from 'lodash';
import { JsModelType } from './iJs';
import { JsValue } from '../../toJsSchema';
import JsString from './JsString';
import JsBoolean from './JsBoolean';
import JsObject from './JsObject';
import JsNullish from './JsNullish';
import JsFunction from './JsFunction';
import iParentable from './iParentable';

export const toModel = (value: JsValue, parent: iParentable): JsModelType => {
    switch (value.type) {
        case 'string':
            return new JsString(value, parent);
        case 'number':
            return new JsNumber(value, parent);
        case 'boolean':
            return new JsBoolean(value, parent); // Assuming boolean is handled as string for simplicity
        case 'array':
            return new JsArray(value, parent);
        case 'object':
            return new JsObject(value, parent);
        case 'nullish':
            return new JsNullish(value, parent);
        case 'function':
            return new JsFunction(value, parent);
        default:
            throw new Error(`Unsupported JS schema type: ${(value as any).type}`);
    }
};

export const castToType = <T extends JsValue>(value: JsValue, to: JsValue['type']): T['value'] => {
    switch (to) {
        case 'string':
            return _.isString(value.value) ? value.value : String(value.value);
        case 'number':
            return _.isNumber(value.value) ? value.value : Number(value.value);
        case 'boolean':
            return _.isBoolean(value.value) ? value.value : Boolean(value.value);
        case 'array':
            return _.isArray(value.value) ? value.value : [value];
        case 'object':
            return _.isObject(value.value) ? value.value : [value];
        case 'nullish':
            return value.value === 'null' ? null : undefined;
        default:
            throw new Error(`Unsupported type for casting: ${to}`);
    }
};
