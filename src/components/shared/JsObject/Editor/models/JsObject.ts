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
}

export default JsObject;
