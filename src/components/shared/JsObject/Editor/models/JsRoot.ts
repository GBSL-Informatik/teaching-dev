import { action, computed, observable } from 'mobx';
import iJs, { JsModelType } from './iJs';
import { JsTypes } from '../../toJsSchema';

class JsRoot {
    readonly type = 'root';
    values = observable.array<JsModelType>([], { deep: false });
    @action
    setValues(values: JsModelType[]) {
        this.values.replace(values);
    }

    @action
    remove(model: iJs) {
        console.log('Removing model:', model);
        this.values.remove(model as JsModelType);
    }

    @computed
    get isDirty(): boolean {
        return this.values.some((value) => value.isDirty);
    }

    @computed
    get serialized(): Record<string, JsTypes> | JsTypes[] {
        const isObject = this.values.some((o) => o.name !== undefined);
        if (isObject) {
            return this.values.reduce(
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
        return this.values.map((model) => model.serialized);
    }
}

export default JsRoot;
