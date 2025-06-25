import { action, computed } from 'mobx';
import iJs, { JsModelType } from './iJs';
import { JsTypes, JsRoot as JsRootType, toJsSchema, EditLevel } from '../../toJsSchema';
import iParentable from './iParentable';
import { toModel } from './toModel';

class JsRoot extends iParentable<JsRootType> {
    readonly type = 'root';

    constructor(editLevel?: EditLevel) {
        super({ type: 'root', value: [], editLevel: editLevel }, null as any);
    }

    @action
    buildFromJs(js: Record<string, JsTypes> | JsTypes[]) {
        const jsSchema = toJsSchema(js);
        if (this.editLevel !== 'all') {
            jsSchema.forEach((prop) => {
                prop.editLevel = this.editLevel;
            });
        }
        const models = jsSchema.map((js) => toModel(js, this));
        this.setValues(models);
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
    get isObject(): boolean {
        return this._value.some((o) => o.name !== undefined);
    }

    @computed
    get isArray(): boolean {
        return !this.isObject;
    }

    @computed
    get jsSchema(): Record<string, JsTypes> | JsTypes[] {
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

    @computed
    get asJs(): Record<string, JsTypes> | JsTypes[] {
        if (this.isArray) {
            return this._value.map((model) => model.asJs);
        }
        return this.value.reduce(
            (acc, model) => {
                if (!model.name) {
                    return acc;
                }
                acc[model.name] = model.asJs;
                return acc;
            },
            {} as Record<string, JsTypes>
        );
    }

    @action
    save() {
        this.buildFromJs(this.asJs);
    }
}

export default JsRoot;
