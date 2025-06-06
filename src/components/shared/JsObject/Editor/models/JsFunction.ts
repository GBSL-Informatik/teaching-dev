import iJs, { ParentType } from './iJs';
import { JsFunction as JsFunctionType } from '../../toJsSchema';
class JsFunction extends iJs {
    readonly type = 'function';
    readonly value: JsFunctionType;

    constructor(js: JsFunctionType, parent: ParentType) {
        super(js, parent);
        this.value = js;
    }
    get serialized(): JsFunctionType {
        return this.value;
    }
}

export default JsFunction;
