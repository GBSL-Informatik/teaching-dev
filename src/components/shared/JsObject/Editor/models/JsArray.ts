import { computed } from 'mobx';
import type { JsArray as JsArrayType, JsParents, JsTypes } from '../../toJsSchema';
import iParentable from './iParentable';

class JsArray extends iParentable<JsArrayType> {
    readonly type = 'array';

    constructor(js: JsArrayType, parent: iParentable<JsParents>) {
        super(js, parent);
    }

    @computed
    get asJs(): JsTypes[] {
        return this.value.map((item) => item.asJs);
    }
}

export default JsArray;
