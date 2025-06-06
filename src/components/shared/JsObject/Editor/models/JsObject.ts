import { action, computed, observable } from 'mobx';
import _ from 'lodash';
import { toModel } from './toModel';
import { JsObject as JsObjectType, JsParents, JsTypeName, JsValue } from '../../toJsSchema';
import iParentable from './iParentable';

class JsObject extends iParentable<JsObjectType> {
    readonly type = 'object';
    @observable accessor collapsed: boolean = false;

    constructor(js: JsObjectType, parent: iParentable<JsParents>) {
        super(js, parent);
    }

    @computed
    get keys(): string[] {
        return [...new Set(this._value.filter((prop) => !!prop.name).map((prop) => prop.name!))].sort();
    }

    @action
    setCollapsed(value: boolean) {
        this.collapsed = value;
    }

    @action
    createProperty(type: JsTypeName) {
        const name = `${this.value.length + 1}`;
        const newProperty = toModel({ type, name } as JsValue, this);
        this._value.push(newProperty);
        if (this.collapsed) {
            this.setCollapsed(false);
        }
        return newProperty;
    }
}

export default JsObject;
