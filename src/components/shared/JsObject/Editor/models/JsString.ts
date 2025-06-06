import { action, computed, observable } from 'mobx';
import iJs, { ParentType } from './iJs';
import { JsString as JsStringType } from '../../toJsSchema';

class JsString extends iJs {
    readonly type = 'string';
    @observable accessor value: string;

    constructor(js: JsStringType, parent: ParentType) {
        super(js, parent);
        this.value = js.value;
    }

    @action
    setValue(value: string) {
        this.value = value;
    }

    @computed
    get serialized(): JsStringType {
        const js: JsStringType = {
            type: this.type,
            value: this.value
        };
        if (this.name) {
            js.name = this.name;
        }
        return js;
    }
}

export default JsString;
