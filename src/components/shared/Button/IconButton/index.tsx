import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { action } from 'mobx';
import Icon from '@mdi/react';
import { IfmColors } from '@tdev-components/shared/Colors';

interface Props {
    path: string;
    className?: string;
    size?: string | number;
    title?: string;
    color?: string;
    disabled?: boolean;
    onHover?: (isHovered: boolean, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const IconButton = observer((props: Props) => {
    const ref = React.useRef<HTMLButtonElement>(null);
    return (
        <button
            ref={ref}
            role="button"
            type="button"
            onMouseOver={(e) => {
                props.onHover?.(true, e);
            }}
            onMouseOut={(e) => {
                props.onHover?.(false, e);
            }}
            onClick={action((e) => {
                props.onClick?.(e);
            })}
            disabled={props.disabled}
            className={clsx(styles.button, props.className)}
            style={{ ['--tdev-icon-button-size' as any]: props.size }}
        >
            <Icon
                path={props.path}
                size={`calc(var(--tdev-icon-button-size) - 8px)`}
                color={props.color ?? IfmColors.primary}
                className={styles.icon}
                title={props.title}
            />
        </button>
    );
});

export default IconButton;
