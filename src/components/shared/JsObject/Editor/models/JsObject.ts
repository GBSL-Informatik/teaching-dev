import { computed } from 'mobx';
import _ from 'es-toolkit/compat';
import type { JsObject as JsObjectType, JsParents, JsTypes } from '../../toJsSchema';
import iParentable from './iParentable';

class JsObject extends iParentable<JsObjectType> {
    readonly type = 'object';

    constructor(js: JsObjectType, parent: iParentable<JsParents>) {
        super(js, parent);
    }

    @computed
    get keys(): string[] {
        return [...new Set(this._value.filter((prop) => !!prop.name).map((prop) => prop.name!))].sort();
    }

    @computed
    get asJs(): Record<string, JsTypes | JsTypes[]> {
        const result: Record<string, JsTypes | JsTypes[]> = {};
        this._value.forEach((prop) => {
            if (prop.name) {
                result[prop.name] = prop.asJs;
            }
        });
        return result;
    }
}

export default JsObject;
