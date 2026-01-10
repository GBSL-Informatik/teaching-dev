import React from 'react';
import { observer } from 'mobx-react-lite';
import type { JsModelType } from '../models/iJs';
import JsArray from '../JsArray';
import JsObject from '../JsObject';
import JsString from '../JsString';
import JsNumber from '../JsNumber';
import JsBoolean from '../JsBoolean';
import JsNullish from '../JsNullish';
import JsFunction from '../../Viewer/JsFunction';
import type { CustomAction } from '..';

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
