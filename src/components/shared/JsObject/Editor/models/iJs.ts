import { action, computed, observable } from 'mobx';
import { JsValue, type JsTypeName } from '../../toJsSchema';
import JsNumber from './JsNumber';
import JsBoolean from './JsBoolean';
import JsString from './JsString';
import JsObject from './JsObject';
import JsArray from './JsArray';
import JsRoot from './JsRoot';
import JsNullish from './JsNullish';
import JsFunction from './JsFunction';
import _ from 'lodash';

export type JsModelType = JsObject | JsString | JsNumber | JsArray | JsBoolean | JsNullish | JsFunction;
export type ParentType = JsObject | JsArray | JsRoot;

abstract class iJs<T extends JsValue = JsValue> {
    readonly parent: ParentType;
    abstract readonly type: JsTypeName;
    readonly _pristine: T;
    @observable accessor name: string | undefined;

    constructor(js: T, parent: ParentType) {
        this._pristine = js;
        this.name = js.name;
        this.parent = parent;
    }

    @computed
    get pristineName(): string | undefined {
        return this._pristine.name;
    }

    @action
    setName(name: string) {
        this.name = name;
    }

    @action
    remove(model?: iJs) {
        if (!model) {
            this.parent.remove(this);
        }
    }

    @computed
    get isDirty(): boolean {
        return !_.isEqual(this.serialized, this._pristine);
    }

    abstract get serialized(): T;

    // abstract changeType(type: JsTypeName): void;
}

export default iJs;
