import React from 'react';
import _ from 'lodash';
import PropertyEditor from './PropertyEditor';
import Popup from 'reactjs-popup';
import { mdiCog } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { PopupActions } from 'reactjs-popup/dist/types';

export interface GenericPropery {
    name: string;
    required?: boolean;
    placeholder?: string;
    label?: string;
    description?: string;
    type: React.HTMLInputTypeAttribute | 'expression';
    value?: string;
    lang?: string;
    sideEffect?: (
        props: Record<string, string | number | undefined>,
        initial: Record<string, string | number | undefined>
    ) => { name: string; value: string }[] | void;
    resettable?: boolean;
    onRecalc?: () => string;
}
export interface GenericValueProperty extends GenericPropery {
    value: string;
}

export interface Props {
    properties: GenericPropery[];
    onUpdate: (values: GenericValueProperty[]) => void;
    values: Record<string, string>;
    title?: string;
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
            />
        </Popup>
    );
};

export default GenericAttributeEditor;
