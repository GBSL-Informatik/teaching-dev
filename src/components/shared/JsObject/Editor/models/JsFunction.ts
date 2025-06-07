import iJs from './iJs';
import { JsFunction as JsFunctionType } from '../../toJsSchema';
import type iParentable from './iParentable';
class JsFunction extends iJs {
    readonly type = 'function';
    readonly value: JsFunctionType;

    constructor(js: JsFunctionType, parent: iParentable) {
        super(js, parent);
        this.value = js;
    }
    get serialized(): JsFunctionType {
        return this.value;
    }

    get asJs(): Function {
        return this.value.value;
    }
}

export default JsFunction;
