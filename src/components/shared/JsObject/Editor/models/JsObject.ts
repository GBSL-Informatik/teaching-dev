import { action, computed, observable } from 'mobx';
import iJs, { JsModelType, ParentType } from './iJs';
import _ from 'lodash';
import { toModel } from './toModel';
import { JsObject as JsObjectType, JsTypeName, JsValue, sortValues } from '../../toJsSchema';

class JsObject extends iJs<JsObjectType> {
    readonly type = 'object';
    @observable accessor collapsed: boolean = false;
    _value = observable.array<JsModelType>([], { deep: false });

    constructor(js: JsObjectType, parent: ParentType) {
        super(js, parent);
        this._value.replace(js.value.map((prop) => toModel(prop, this)));
    }

    @computed
    get keys(): string[] {
        return [...new Set(this._value.filter((prop) => !!prop.name).map((prop) => prop.name!))].sort();
    }

    @computed
    get value(): JsModelType[] {
        return sortValues(this._value);
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

    @computed
    get serialized() {
        const js: JsObjectType = {
            type: this.type,
            value: this.value.map((prop) => prop.serialized) as JsValue[]
        };
        if (this.name) {
            js.name = this.name;
        }
        return js;
    }

    @action
    remove(model?: iJs) {
        if (!model) {
            this.parent.remove(this);
        } else {
            this._value.remove(model as JsModelType);
        }
    }

    // @action
    // changeType(type: iJsonType): void {
    //     if (this.parent.type === 'schema') {
    //         return;
    //     }
    //     this.parent.replaceProperty(
    //         this,
    //         toModel(
    //             this.name,
    //             { type, description: this.description } as JsonSchemaType,
    //             this.parent as JsArray | JsObject
    //         )
    //     );
    // }

    @action
    replaceProperty(old: iJs, newProperty: JsModelType) {
        this._value.remove(old as JsModelType);
        this._value.push(newProperty);
    }
}

export default JsObject;
