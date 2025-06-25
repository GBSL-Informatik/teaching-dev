import React from 'react';
import { observer } from 'mobx-react-lite';
import { GenericValue as GenericValueType } from '@tdev-components/shared/JsObject/toJsSchema';
import JsType from '@tdev-components/shared/JsObject/Viewer/JsType';
import GenericValue from '@tdev-components/shared/JsObject/Viewer/GenericField/GenericValue';

export interface Props {
    js: GenericValueType;
    className?: string;
}

const GenericField = observer((props: Props) => {
    const { js } = props;

    if (js.name === undefined) {
        return <GenericValue {...props} js={js} />;
    }

    return (
        <JsType js={js}>
            <GenericValue {...props} js={js} />
        </JsType>
    );
});

export default GenericField;
