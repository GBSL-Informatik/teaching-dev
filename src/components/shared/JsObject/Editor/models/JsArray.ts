import { action, computed, observable } from 'mobx';
import iJs, { JsModelType, ParentType } from './iJs';
import { toModel } from './toModel';
import { JsArray as JsArrayType, JsValue, sortValues } from '../../toJsSchema';
import _ from 'lodash';

class JsArray extends iJs<JsArrayType> {
    readonly type = 'array';
    _value = observable.array<JsModelType>([], { deep: false });

    constructor(js: JsArrayType, parent: ParentType) {
        super(js, parent);
        this._value.replace(js.value.map((item) => toModel(item, this)));
    }

    @computed
    get value(): JsModelType[] {
        return sortValues(this._value);
    }

    @computed
    get serialized(): JsArrayType {
        const js: JsArrayType = {
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
    //     this.parent.replaceProperty(
    //         this,
    //         toModel(
    //             this.name,
    //             { type, description: this.description } as JsonSchemaType,
    //             this.parent as JsArray | JsObject
    //         )
    //     );
    // }
}

export default JsArray;
