import { JsString, JsValue } from '@tdev-components/shared/JsObject/toJsSchema';
import GenericField from '@tdev-components/shared/JsObject/Viewer/GenericField';
import JsonArray from '@tdev-components/shared/JsObject/Viewer/JsArray';
import JsFunction from '@tdev-components/shared/JsObject/Viewer/JsFunction';
import JsObject from '@tdev-components/shared/JsObject/Viewer/JsObject';
import { observer } from 'mobx-react-lite';

export interface Props {
    js: JsValue;
    className?: string;
    nestingLevel: number;
}

const JsTypeSwitcher = observer((props: Props) => {
    const { js } = props;
    if (!js) {
        return null;
    }
    switch (js.type) {
        case 'array':
            return <JsonArray {...props} js={js} />;
        case 'object':
            return <JsObject {...props} js={js} />;
        case 'function':
            return <JsFunction {...props} js={js} />;
        default:
            return <GenericField {...props} js={js as JsString} />;
    }
});

export default JsTypeSwitcher;
