import { JsArray as JsArrayType, JsParents, JsTypes } from '../../toJsSchema';
import _ from 'lodash';
import iParentable from './iParentable';
import { computed } from 'mobx';

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
