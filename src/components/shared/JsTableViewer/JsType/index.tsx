import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import shared from '@tdev-components/shared/JsTableViewer/styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '@tdev-hooks/useTranslation';
import { JsValue } from '@tdev-components/shared/JsTableViewer/toJsSchema';

interface Props {
    js: JsValue;
    className?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

const JsType = observer((props: Props) => {
    const { js, className } = props;
    const name = useTranslation(js.name);
    return (
        <>
            <div className={clsx(shared.name, styles.name, className)}>
                {name}
                {props.actions && <div className={clsx(styles.actions)}>{props.actions}</div>}
            </div>
            <div className={clsx(shared.value)}>{props.children}</div>
        </>
    );
});

export default JsType;
