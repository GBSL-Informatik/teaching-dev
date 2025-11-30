import { action, computed, observable } from 'mobx';
import iJs from './iJs';
import { JsNumber as JsNumberType } from '../../toJsSchema';
import type iParentable from './iParentable';

class JsNumber extends iJs {
    readonly type = 'number';
    @observable accessor _inputValue: string;
    @observable accessor value: number;

    constructor(js: JsNumberType, parent: iParentable) {
        super(js, parent);
        this.value = js.value;
        this._inputValue = String(js.value);
    }

    @action
    setValue(value: number | string) {
        this._inputValue = String(value);
        try {
            const num = Number(value);
            if (!isNaN(num)) {
                this.value = num;
            }
        } catch {
            // keep the old value
        }
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

    @computed
    get asJs(): number {
        return this.value;
    }
}

export default JsNumber;
