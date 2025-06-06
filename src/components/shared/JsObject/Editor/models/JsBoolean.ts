import { action, computed, observable } from 'mobx';
import iJs, { JsModelType, ParentType } from './iJs';
import JsArray from './JsArray';
import JsObject from './JsObject';
import { JsBoolean as JsBooleanType } from '../../toJsSchema';

class JsBoolean extends iJs {
    readonly type = 'boolean';
    @observable accessor value: boolean;

    constructor(js: JsBooleanType, parent: ParentType) {
        super(js, parent);
        this.value = js.value;
    }

    @action
    setValue(value: boolean) {
        this.value = value;
    }

    @computed
    get serialized(): JsBooleanType {
        const js: JsBooleanType = {
            type: this.type,
            value: this.value
        };
        if (this.name) {
            js.name = this.name;
        }
        return js;
    }
}

export default JsBoolean;
