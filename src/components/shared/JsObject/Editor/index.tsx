import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { JsTypes, toJsSchema } from '../toJsSchema';
import clsx from 'clsx';
import styles from './styles.module.scss';
import JsSchemaEditor from './JsSchemaEditor';
import { toModel } from './models/toModel';
import JsRoot from './models/JsRoot';
import { reaction } from 'mobx';
import AddValue from './Actions/AddValue';

interface Props {
    className?: string;
    js: Record<string, JsTypes> | JsTypes[];
    onChange?: (js: Record<string, JsTypes> | JsTypes[]) => void;
}

const JsObjectEditor = observer((props: Props) => {
    const jsRoot = useLocalObservable(() => {
        const jsSchema = toJsSchema(props.js);
        const root = new JsRoot();
        const models = jsSchema.map((js) => toModel(js, root));
        root.setValues(models);
        return root;
    });

    // Effect that triggers upon observable changes.
    React.useEffect(() => {
        return reaction(
            () => jsRoot.isDirty,
            (isDirty) => {
                console.log('JsObjectEditor dirty state changed', jsRoot.isDirty);
                if (isDirty) {
                }
            }
        );
    }, [jsRoot]);

    console.log('JsObjectEditor', jsRoot.isArray);

    return (
        <div className={clsx(styles.jsObjectEditor, props.className)}>
            <div className={clsx(styles.spacer)} />
            <div>
                <AddValue jsParent={jsRoot} className={clsx(styles.actions)} />
                <JsSchemaEditor schema={jsRoot.value} noName={jsRoot.isArray} />
            </div>
            <div className={clsx(styles.spacer)} />
        </div>
    );
});

export default JsObjectEditor;
