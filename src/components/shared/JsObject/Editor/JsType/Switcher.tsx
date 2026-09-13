import { observer } from 'mobx-react-lite';
import type { CustomAction } from '..';
import JsFunction from '../../Viewer/JsFunction';
import JsArray from '../JsArray';
import JsBoolean from '../JsBoolean';
import JsNullish from '../JsNullish';
import JsNumber from '../JsNumber';
import JsObject from '../JsObject';
import JsString from '../JsString';
import type { JsModelType } from '../models/iJs';

export interface Props {
    js: JsModelType;
    className?: string;
    noName?: boolean;
    actions?: CustomAction[];
}

const JsTypeSwitcher = observer((props: Props) => {
    const { js } = props;
    switch (js.type) {
        case 'array':
            return <JsArray {...props} js={js} />;
        case 'object':
            return <JsObject {...props} js={js} />;
        case 'string':
            return <JsString {...props} js={js} />;
        case 'number':
            return <JsNumber {...props} js={js} />;
        case 'boolean':
            return <JsBoolean {...props} js={js} />;
        case 'nullish':
            return <JsNullish {...props} js={js} />;
        case 'function':
            return <JsFunction {...props} js={js.value} />;
    }
});

export default JsTypeSwitcher;
