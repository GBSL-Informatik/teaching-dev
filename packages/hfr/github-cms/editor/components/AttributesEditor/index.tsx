import { mdiCog } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import React from 'react';
import Popup from 'reactjs-popup';
import type { PopupActions } from 'reactjs-popup/dist/types';
import AttributesForm, { type AttributeRow } from './AttributesForm';
import styles from './styles.module.scss';

interface Props {
    title: string;
    rows: AttributeRow[];
    onApply: (rows: AttributeRow[]) => void;
    /** jsx supports expressions, directives only support strings */
    allowExpressions?: boolean;
}

/**
 * A cog button which opens the attributes form in a modal.
 * The form is mounted on each opening, so it starts with the current attributes.
 */
const AttributesEditor = (props: Props) => {
    const ref = React.useRef<PopupActions>(null);

    const handleApply = (rows: AttributeRow[]) => {
        props.onApply(rows);
        ref.current?.close();
    };

    return (
        <Popup
            trigger={
                <span>
                    <Button icon={mdiCog} size={SIZE_S} title={props.title} />
                </span>
            }
            ref={ref}
            modal
            on="click"
            nested
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <Card header={<h4>{props.title}</h4>} classNames={{ card: styles.card }}>
                <AttributesForm
                    rows={props.rows}
                    allowExpressions={props.allowExpressions}
                    onApply={handleApply}
                    onCancel={() => ref.current?.close()}
                />
            </Card>
        </Popup>
    );
};

export default AttributesEditor;
