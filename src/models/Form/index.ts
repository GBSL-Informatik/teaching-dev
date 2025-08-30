import _ from 'es-toolkit/compat';
import { action, computed, observable, runInAction } from 'mobx';
import { computedFn } from 'mobx-utils';
import Field, { FormField } from './Field';

export default class Form<T = string> {
    readonly defaultValue: T;
    fields = observable.array<Field<T>>([]);
    private _initFields: FormField<T>[];
    isRunningSideEffect = false;

    constructor(fields: FormField<T>[], defaultValue: T) {
        this.defaultValue = defaultValue;
        this._initFields = fields;
        this.fields.replace(fields.map((f) => new Field(f, this, true)));
    }

    find = computedFn(function (this: Form<T>, name?: string): Field<T> | undefined {
        if (!name) {
            return;
        }
        return this.fields.find((f) => f.name === name);
    });

    @action
    resetAll() {
        this.fields.replace(this._initFields.map((f) => new Field(f, this, true)));
    }

    @action
    resetField(name: string, toDefault?: boolean) {
        const field = this.find(name);
        if (field?.isInitField) {
            field.resetValue(toDefault);
        } else {
            this.removeField(name);
        }
    }

    @action
    setValue(name: string, value: T) {
        const field = this.find(name);
        if (field) {
            field.setValue(value);
        } else {
            this.fields.push(new Field({ name, value, type: 'text', removable: true }, this));
        }
    }

    @action
    runSideEffect(field?: Field<T>) {
        if (!field || !field.sideEffect || this.isRunningSideEffect) {
            return;
        }
        try {
            this.isRunningSideEffect = true;
            runInAction(() => {
                field?.sideEffect?.(this);
            });
        } catch (e) {
            console.warn('Error in side effect', e);
        } finally {
            this.isRunningSideEffect = false;
        }
    }

    @computed
    get values() {
        const res: Record<string, T> = {};
        this.fields.forEach((field) => {
            res[field.name] = field.value;
        });
        return res;
    }

    @computed
    get dirtyFields() {
        const dirty = new Set<string>(this.fields.filter((f) => f.isDirty).map((f) => f.name));
        return dirty;
    }

    @action
    removeField(name: string) {
        const field = this.find(name);
        if (!field) {
            return;
        }
        if (field.isInitField && !field.isRemovable) {
            field.resetValue();
        } else {
            this.fields.remove(field);
        }
    }
}
