import React from 'react';
import _ from 'es-toolkit/compat';
import PropertyEditor from '../PropertyEditor';
import Popup from 'reactjs-popup';
import { mdiCog } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { PopupActions } from 'reactjs-popup/dist/types';
import type { FormField } from '@tdev-models/Form/Field';

export type GenericPropery = FormField<string>;

export interface GenericValueProperty extends GenericPropery {
    value: string;
}

export interface Props {
    properties: GenericPropery[];
    onUpdate: (values: GenericValueProperty[]) => void;
    values: Record<string, string>;
    title?: string;
    canExtend?: boolean;
}

const GenericAttributeEditor = (props: Props) => {
    const { properties, onUpdate, values } = props;
    const ref = React.useRef<PopupActions>(null);
    return (
        <Popup
            trigger={
                <span>
                    <Button icon={mdiCog} size={0.8} title={props.title} />
                </span>
            }
            keepTooltipInside="#__docusaurus"
            overlayStyle={{ background: 'rgba(0,0,0,0.5)', maxWidth: '100vw' }}
            ref={ref}
            modal
            on="click"
            repositionOnResize
            nested
        >
            <PropertyEditor
                values={values}
                onUpdate={onUpdate}
                properties={properties}
                onClose={() => ref.current?.close()}
                canExtend={props.canExtend}
            />
        </Popup>
    );
};

export default GenericAttributeEditor;
