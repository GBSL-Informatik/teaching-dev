import { action, computed, observable } from 'mobx';
import iJs from './iJs';
import { JsString as JsStringType } from '../../toJsSchema';
import type iParentable from './iParentable';

class JsString extends iJs {
    readonly type = 'string';
    @observable accessor value: string;

    constructor(js: JsStringType, parent: iParentable) {
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

    @computed
    get asJs(): string {
        return this.value;
    }
}

export default JsString;
