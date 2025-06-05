import React from 'react';
import { observer } from 'mobx-react-lite';
import { JsTypes, toJsSchema } from '@tdev-components/shared/JsTableViewer/toJsSchema';
import JsSchemaViewer from '@tdev-components/shared/JsTableViewer/JsSchemaViewer';

export interface Props {
    js: Record<string, JsTypes> | JsTypes[];
    className?: string;
    collapseAt?: number;
}

export const CollapseAtContext = React.createContext<number | undefined>(undefined);

const JsTableViewer = observer((props: Props) => {
    const jsSchema = React.useMemo(() => {
        return toJsSchema(props.js);
    }, [props.js]);
    return (
        <CollapseAtContext.Provider value={props.collapseAt}>
            <JsSchemaViewer schema={jsSchema} className={props.className} nestingLevel={1} />
        </CollapseAtContext.Provider>
    );
});

export default JsTableViewer;
