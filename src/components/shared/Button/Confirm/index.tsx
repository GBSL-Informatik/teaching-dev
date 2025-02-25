import React from 'react';
import clsx from 'clsx';

import styles from './styles.module.scss';
import Button from '..';
import { mdiClose } from '@mdi/js';
import { Color } from '@tdev-components/shared/Colors';

interface Props {
    className?: string;
    onConfirm: () => void;
    title?: string;
    icon: string;
    text?: string | null;
    cancelIcon?: string;
    confirmIcon?: string;
    confirmText?: string;
    confirmColor?: Color | string;
    color?: Color | string;
    size?: number;
    iconSide?: 'left' | 'right';
    disabled?: boolean;
    disableConfirm?: boolean;
    spin?: boolean;
    buttonClassName?: string;
}

const getValue = (value: undefined | string | null, defaultVal: string | undefined) => {
    if (value === null) {
        return undefined;
    }
    return value ?? defaultVal;
};

export const Confirm = (props: Props) => {
    const [isConfirming, setIsConfirming] = React.useState(false);
    return (
        <div className={clsx(styles.confirm, props.className, 'button-group')}>
            {isConfirming && (
                <Button
                    icon={props.cancelIcon || mdiClose}
                    iconSide="left"
                    size={props.size || 1}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsConfirming(false);
                    }}
                    className={clsx(props.buttonClassName)}
                />
            )}
            <Button
                text={
                    (isConfirming
                        ? getValue(props.confirmText, 'Ja')
                        : getValue(props.text, undefined)) as string
                }
                title={props.title}
                color={isConfirming ? props.confirmColor || props.color : props.color}
                icon={isConfirming ? props.confirmIcon || props.icon : props.icon}
                size={props.size || 1}
                iconSide={isConfirming ? 'right' : props.iconSide}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isConfirming || props.disableConfirm) {
                        props.onConfirm();
                        setIsConfirming(false);
                    } else {
                        setIsConfirming(true);
                    }
                }}
                disabled={props.disabled}
                spin={props.spin}
                className={clsx(props.buttonClassName)}
            />
        </div>
    );
};
