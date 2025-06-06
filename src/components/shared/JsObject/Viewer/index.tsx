import React from 'react';
import { observer } from 'mobx-react-lite';
import { JsTypes, toJsSchema } from '@tdev-components/shared/JsObject/toJsSchema';
import JsSchemaViewer from '@tdev-components/shared/JsObject/Viewer/JsSchemaViewer';
import clsx from 'clsx';
import styles from './styles.module.scss';

export interface Props {
    js: Record<string, JsTypes> | JsTypes[];
    className?: string;
    schemaViewerClassName?: string;
    collapseAt?: number;
}

export const CollapseAtContext = React.createContext<number | undefined>(undefined);

const JsObjectViewer = observer((props: Props) => {
    const jsSchema = React.useMemo(() => {
        return toJsSchema(props.js);
    }, [props.js]);
    return (
        <div className={clsx(styles.jsTableViewer, props.className)}>
            <CollapseAtContext.Provider value={props.collapseAt}>
                <JsSchemaViewer schema={jsSchema} className={props.schemaViewerClassName} nestingLevel={1} />
            </CollapseAtContext.Provider>
        </div>
    );
});

export default JsObjectViewer;
