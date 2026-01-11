import { action, computed, observable } from 'mobx';
import iJs from './iJs';
import type { JsNullish as JsNullishType } from '../../toJsSchema';
import type iParentable from './iParentable';

class JsNullish extends iJs {
    readonly type = 'nullish';
    @observable accessor value: null | undefined;

    constructor(js: JsNullishType, parent: iParentable) {
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

    @computed
    get asJs(): null | undefined {
        return this.value;
    }
}

export default JsNullish;
