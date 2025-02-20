import React from 'react';
import _ from 'lodash';

import Editor from './Editor';
import type { GenericPropery, GenericValueProperty } from '../GenericAttributeEditor';

export interface Props {
    properties: GenericPropery[];
    values: Record<string, string>;
    onUpdate: (values: GenericValueProperty[]) => void;
    onClose?: () => void;
}

const PropertyEditor = (props: Props) => {
    const { properties, values } = props;
    const cProps = React.useMemo(
        () =>
            properties.map<GenericPropery>((prop) => {
                return { ...prop, value: values[prop.name] || '' };
            }),
        [values, properties]
    );

    const onChange = React.useCallback(
        (values: Record<string, string>) => {
            const updatedAttributes = Object.entries(values)
                .map<GenericValueProperty | undefined>(([name, value]) => {
                    const property = properties.find((prop) => prop.name === name);
                    if (!property) {
                        return;
                    }
                    return { ...property, value: value };
                })
                .filter((a) => !!a);

            props.onUpdate(updatedAttributes);
        },
        [values, props.onUpdate, properties]
    );
    if (properties.length === 0) {
        return null;
    }
    return <Editor onChange={onChange} properties={cProps} onClose={props.onClose} />;
};

export default PropertyEditor;
