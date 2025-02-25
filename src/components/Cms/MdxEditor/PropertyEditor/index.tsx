import React from 'react';
import _ from 'lodash';

import Editor from './Editor';
import type { GenericPropery, GenericValueProperty } from '../GenericAttributeEditor';

export interface Props {
    properties: GenericPropery[];
    values: Record<string, string>;
    onUpdate: (values: GenericValueProperty[]) => void;
    onClose?: () => void;
    canExtend?: boolean;
}

const PropertyEditor = (props: Props) => {
    const { properties, values, canExtend } = props;
    const cProps = React.useMemo(() => {
        const knownProps = properties.map<GenericPropery>((prop) => {
            return { ...prop, value: values[prop.name] || '' };
        });
        if (!canExtend) {
            return knownProps;
        }
        const unknownProps = Object.keys(values)
            .filter((key) => !!values[key] && !properties.find((prop) => prop.name === key))
            .map<GenericPropery>((key) => {
                const value = values[key];
                const valType =
                    value === 'true' || value === 'false'
                        ? 'checkbox'
                        : /^(\{|\[)/.test(value)
                          ? 'expression'
                          : 'text';
                return { name: key, value: value, type: valType };
            });
        return [...knownProps, ...unknownProps];
    }, [values, properties, canExtend]);

    const onChange = React.useCallback(
        (values: Record<string, string>) => {
            const updatedAttributes = Object.entries(values)
                .map<GenericValueProperty | undefined>(([name, value]) => {
                    const property = cProps.find((prop) => prop.name === name);
                    if (!property) {
                        return;
                    }
                    return { ...property, value: value };
                })
                .filter((a) => !!a);

            props.onUpdate(updatedAttributes);
        },
        [values, props.onUpdate, cProps]
    );
    if (cProps.length === 0) {
        return null;
    }
    return <Editor onChange={onChange} properties={cProps} onClose={props.onClose} canExtend={canExtend} />;
};

export default PropertyEditor;
