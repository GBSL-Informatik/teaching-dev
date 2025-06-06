import { JsArray as JsArrayType, JsParents } from '../../toJsSchema';
import _ from 'lodash';
import iParentable from './iParentable';

class JsArray extends iParentable<JsArrayType> {
    readonly type = 'array';

    constructor(js: JsArrayType, parent: iParentable<JsParents>) {
        super(js, parent);
    }
}

export default JsArray;
