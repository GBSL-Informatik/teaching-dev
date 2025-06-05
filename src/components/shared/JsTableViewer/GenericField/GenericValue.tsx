import React from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { GenericValue as GenericValueType } from '@tdev-components/shared/JsTableViewer/toJsSchema';
import { IfmColors } from '@tdev-components/shared/Colors';
import Badge from '@tdev-components/shared/Badge';

interface Props {
    js: Omit<GenericValueType, 'name'>;
    className?: string;
}

const GenericValue = observer((props: Props) => {
    const { js, className } = props;

    switch (js.type) {
        case 'boolean':
            return (
                <Badge color={js.value ? IfmColors.blue : IfmColors.gray}>
                    {js.value ? 'True' : 'False'}
                </Badge>
            );
        case 'nullish':
            return <Badge type="secondary">{js.value === undefined ? 'undefined' : 'null'}</Badge>;
        case 'string':
            if (/https?:\/\/[^\s]+/.test(js.value as string)) {
                return (
                    <a href={js.value as string} target="_blank" className={clsx(className)}>
                        {js.value}
                    </a>
                );
            }
            return <div className={clsx(className)}>{js.value}</div>;
        case 'number':
            return <code className={clsx(className)}>{js.value}</code>;
    }
});

export default GenericValue;
