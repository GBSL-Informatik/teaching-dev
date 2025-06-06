import { action, computed, observable } from 'mobx';
import iJs, { ParentType } from './iJs';
import { JsNumber as JsNumberType } from '../../toJsSchema';

class JsNumber extends iJs {
    readonly type = 'number';
    @observable accessor value: number;

    constructor(js: JsNumberType, parent: ParentType) {
        super(js, parent);
        this.value = js.value;
    }

    @action
    setValue(value: number) {
        this.value = value;
    }

    @computed
    get serialized(): JsNumberType {
        const js: JsNumberType = {
            type: this.type,
            value: this.value
        };
        if (this.name) {
            js.name = this.name;
        }
        return js;
    }
}

export default JsNumber;
