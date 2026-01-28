import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import { templateReplacer } from '../templateReplacer';

interface BaseProps {
    as?: 'code' | 'boxed';
}
interface NameProps extends BaseProps {
    name: string;
}
interface ChildProps extends BaseProps {
    code: string;
}

type Props = NameProps | ChildProps;

const Val = observer((props: Props) => {
    const pageStore = useStore('pageStore');
    const { current } = pageStore;
    if (!current) {
        return null;
    }
    let value = '';
    if ('code' in props) {
        value = templateReplacer(props.code, current.dynamicValues);
    } else if ('name' in props) {
        value = current.dynamicValues.get(props.name) || `<${props.name}>`;
    }
    switch (props.as) {
        case 'code':
            return <code>{value}</code>;
        case 'boxed':
            return <strong className="boxed">{value}</strong>;
    }

    return value;
});

export default Val;
