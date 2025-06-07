import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { JsTypes, toJsSchema } from '../toJsSchema';
import clsx from 'clsx';
import styles from './styles.module.scss';
import JsSchemaEditor from './SchemaEditor';
import { toModel } from './models/toModel';
import JsRoot from './models/JsRoot';
import { reaction } from 'mobx';
import AddValue from './Actions/AddValue';
import Button from '@tdev-components/shared/Button';
import { mdiContentSave } from '@mdi/js';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import CodeBlock from '@theme/CodeBlock';

interface Props {
    className?: string;
    js: Record<string, JsTypes> | JsTypes[];
    onChange?: (js: Record<string, JsTypes> | JsTypes[]) => void;
}

const SaveButton = observer(
    ({
        onChange,
        jsRoot
    }: {
        onChange?: (js: Record<string, JsTypes> | JsTypes[]) => void;
        jsRoot: JsRoot;
    }) => (
        <Button
            color="green"
            onClick={() => {
                jsRoot.save();
                onChange?.(jsRoot.asJs);
            }}
            size={SIZE_S}
            icon={mdiContentSave}
            iconSide="left"
            text="Speichern"
            disabled={!jsRoot.isDirty}
        />
    )
);

const JsObjectEditor = observer((props: Props) => {
    const jsRoot = useLocalObservable(() => {
        const root = new JsRoot();
        root.buildFromJs(props.js);
        return root;
    });

    return (
        <div className={clsx(styles.jsObjectEditor, props.className)}>
            <div className={clsx(styles.spacer)} />
            <div>
                <div className={clsx(styles.header)}>
                    <AddValue jsParent={jsRoot} className={clsx(styles.actions)} />
                    <SaveButton onChange={props.onChange} jsRoot={jsRoot} />
                </div>
                <JsSchemaEditor schema={jsRoot} noName={jsRoot.isArray} />
            </div>
            <div className={clsx(styles.spacer)} />
        </div>
    );
});

export default JsObjectEditor;
