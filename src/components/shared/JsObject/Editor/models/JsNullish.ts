import { action, computed, observable } from 'mobx';
import iJs, { ParentType } from './iJs';
import { JsNullish as JsNullishType } from '../../toJsSchema';

class JsNullish extends iJs {
    readonly type = 'nullish';
    @observable accessor value: null | undefined;

    constructor(js: JsNullishType, parent: ParentType) {
        super(js, parent);
        this.value = js.value;
    }

    @action
    setValue(value: null | undefined) {
        this.value = value;
    }

    @computed
    get serialized(): JsNullishType {
        const js: JsNullishType = {
            type: this.type,
            value: this.value
        };
        if (this.name) {
            js.name = this.name;
        }
        return js;
    }
}

export default JsNullish;
