import { action, computed, observable } from 'mobx';
import iJs from './iJs';
import { JsBoolean as JsBooleanType } from '../../toJsSchema';
import type iParentable from './iParentable';

class JsBoolean extends iJs {
    readonly type = 'boolean';
    @observable accessor value: boolean;

    constructor(js: JsBooleanType, parent: iParentable) {
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

    @computed
    get asJs(): boolean {
        return this.value;
    }
}

export default JsBoolean;
