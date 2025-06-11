import React from 'react';
import { observer } from 'mobx-react-lite';
import { JsonType } from '@tdev-models/Ai/JsonSchema';
import JsonArray from './JsonArray';
import JsonString from './JsonString';
import JsonObject from './JsonObject';
import JsonNumber from './JsonNumber';

export interface CommonProps {
    className?: string;
    noName?: boolean;
    noDelete?: boolean;
    onDelete?: () => void;
    noChangeType?: boolean;
}
interface Props extends CommonProps {
    json: JsonType;
}

const SchemaEditor = observer((props: Props) => {
    const { json } = props;

    switch (json.type) {
        case 'string':
            return <JsonString {...props} json={json} />;
        case 'number':
            return <JsonNumber {...props} json={json} />;
        case 'array':
            return <JsonArray {...props} json={json} />;
        case 'object':
            return <JsonObject {...props} json={json} />;
        default:
            return <span>Unknown</span>;
    }
});

export default SchemaEditor;
