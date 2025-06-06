import JsArray from './JsArray';
import JsNumber from './JsNumber';
import _ from 'lodash';
import { JsModelType, ParentType } from './iJs';
import { JsValue } from '../../toJsSchema';
import JsString from './JsString';
import JsBoolean from './JsBoolean';
import JsObject from './JsObject';
import JsNullish from './JsNullish';
import JsFunction from './JsFunction';

export const toModel = (value: JsValue, parent: ParentType): JsModelType => {
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
