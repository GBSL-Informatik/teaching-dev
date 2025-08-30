import { action, computed, observable } from 'mobx';
import iJs, { JsModelType } from './iJs';
import { toModel } from './toModel';
import { JsParents, JsValue, sortValues } from '../../toJsSchema';
import _ from 'es-toolkit/compat';
import type JsRoot from './JsRoot';

abstract class iParentable<T extends JsParents = JsParents> extends iJs<T> {
    abstract readonly type: T['type'];
    readonly isParent = true;
    _value = observable.array<JsModelType>([], { deep: false });
    @observable accessor collapsed: boolean = false;

    constructor(js: T, parent: iParentable) {
        super(js, parent);
        this._value.replace(js.value.map((item) => toModel(item, this)));
    }

    @computed
    get value(): JsModelType[] {
        if (this.type === 'object' || (this.type === 'root' && (this as unknown as JsRoot).isObject)) {
            return sortValues(this._value, 'pristineName');
        }
        return this._value;
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

    @action
    addValue(value: JsModelType, atIndex?: number) {
        if (atIndex !== undefined && atIndex >= 0 && atIndex < this._value.length) {
            this._value.splice(atIndex, 0, value);
        } else {
            this._value.push(value);
        }
    }

    @action
    setCollapsed(value: boolean) {
        this.collapsed = value;
    }

    @computed
    get isArray(): boolean {
        if (this.type === 'root') {
            return (this as unknown as JsRoot).isArray;
        }
        return this.type === 'array';
    }
}

export default iParentable;
