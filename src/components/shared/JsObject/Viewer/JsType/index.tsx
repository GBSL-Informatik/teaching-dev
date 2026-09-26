import { JsValue } from '@tdev-components/shared/JsObject/toJsSchema';
import shared from '@tdev-components/shared/JsObject/Viewer/styles.module.scss';
import { useTranslation } from '@tdev-hooks/useTranslation';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';

interface Props {
    js: JsValue;
    className?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    onClick?: () => void;
}

interface NameProps {
    js: JsValue;
    actions?: React.ReactNode;
    onClick?: () => void;
}

const Name = observer((props: NameProps) => {
    const { js, actions, onClick } = props;
    const name = useTranslation(js.name);
    if (onClick && js.name) {
        return (
            <a
                className={clsx(shared.name, styles.name, styles.clickable)}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick?.();
                }}
                href="#"
                role="button"
            >
                {name}
                {actions && <div className={clsx(styles.actions)}>{actions}</div>}
            </a>
        );
    }
    return (
        <div className={clsx(shared.name, styles.name)} onClick={onClick}>
            {name}
            {actions && <div className={clsx(styles.actions)}>{actions}</div>}
        </div>
    );
});

const JsType = observer((props: Props) => {
    const { js } = props;
    return (
        <>
            <Name js={js} actions={props.actions} onClick={props.onClick} />
            <div className={clsx(shared.value)}>{props.children}</div>
        </>
    );
});

export default JsType;
