import React from 'react';
import { observer } from 'mobx-react-lite';
import { JsValue } from '@tdev-components/shared/JsTableViewer/toJsSchema';
import JsonArray from '@tdev-components/shared/JsTableViewer/JsArray';
import JsObject from '@tdev-components/shared/JsTableViewer/JsObject';
import GenericField from '@tdev-components/shared/JsTableViewer/GenericField';
import JsFunction from '@tdev-components/shared/JsTableViewer/JsFunction';

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
            return <GenericField {...props} js={js} />;
    }
});

export default JsTypeSwitcher;
