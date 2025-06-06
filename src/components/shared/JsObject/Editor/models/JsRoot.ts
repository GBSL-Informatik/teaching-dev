import { action, computed } from 'mobx';
import iJs, { JsModelType } from './iJs';
import { JsTypes, JsRoot as JsRootType } from '../../toJsSchema';
import iParentable from './iParentable';

class JsRoot extends iParentable<JsRootType> {
    readonly type = 'root';

    constructor() {
        super({ type: 'root', value: [] }, null as any);
    }

    @action
    setValues(values: JsModelType[]) {
        this._value.replace(values);
    }

    @action
    remove(model: iJs) {
        this._value.remove(model as JsModelType);
    }

    @computed
    get isDirty(): boolean {
        return this._value.some((value) => value.isDirty);
    }

    @computed
    get jsObject(): Record<string, JsTypes> | JsTypes[] {
        const isObject = this._value.some((o) => o.name !== undefined);
        if (isObject) {
            return this._value.reduce(
                (acc, model) => {
                    if (!model.name) {
                        return acc;
                    }
                    acc[model.name] = model.serialized;
                    return acc;
                },
                {} as Record<string, JsTypes>
            );
        }
        return this._value.map((model) => model.serialized);
    }
}

export default JsRoot;
