import { action, computed, observable } from 'mobx';
import iJs, { JsModelType } from './iJs';
import { toModel } from './toModel';
import { JsParents, JsValue, sortValues } from '../../toJsSchema';
import _ from 'lodash';

abstract class iParentable<T extends JsParents = JsParents> extends iJs<T> {
    abstract readonly type: T['type'];
    _value = observable.array<JsModelType>([], { deep: false });

    constructor(js: T, parent: iParentable) {
        super(js, parent);
        this._value.replace(js.value.map((item) => toModel(item, this)));
    }

    @computed
    get value(): JsModelType[] {
        return sortValues(this._value, 'pristineName');
    }

    @computed
    get serialized(): T {
        const js: JsParents = {
            type: this.type,
            value: this.value.map((prop) => prop.serialized) as JsValue[]
        };
        if (this.name) {
            js.name = this.name;
        }
        return js as T;
    }

    @action
    remove(model?: iJs) {
        if (!model) {
            this.parent.remove(this);
        } else {
            this._value.remove(model as JsModelType);
        }
    }

    @action
    replaceValue(old: iJs, newProperty: JsModelType) {
        this._value.remove(old as JsModelType);
        this._value.push(newProperty);
    }
}

export default iParentable;
